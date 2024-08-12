import { mongo, PaginateModel, PaginateOptions } from 'mongoose';
import {
  ConflictException,
  Injectable,
  PreconditionFailedException,
  InternalServerErrorException,
  NotFoundException,
  OnApplicationBootstrap,
  OnModuleDestroy,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ConfigService } from '@nestjs/config';
import { SchedulerRegistry } from '@nestjs/schedule';
import { Truck, TruckDocument } from './truck.schema';
import {
  CreateTruckDto,
  TruckQuery,
  TruckResultDto,
  PaginatedTruckResultDto,
  TruckResultForMapDto,
  UpdateTruckDto,
  CalculatedDistances,
  TruckChangeDocument,
} from './truck.dto';
import { LoggerService } from '../logger';
import { GoogleGeoApiService } from '../googleGeoApi/googleGeoApi.service';
import { PushService } from '../push/push.service';
import { UserResultDto } from '../user/user.dto';
import {
  EARTH_RADIUS_MILES,
  MONGO_CONNECTION_NAME,
  MONGO_UNIQUE_INDEX_CONFLICT,
  TRUCK_SET_AVAIL_STATUS_JOB,
  TRUCK_SEND_RENEW_LOCATION_PUSH_JOB,
  UNIQUE_CONSTRAIN_ERROR,
} from '../utils/constants';
import { escapeForRegExp } from '../utils/escapeForRegExp';
import { calcDistance } from '../utils/haversine.distance';
import { ChangeDocument, Queue } from '../utils/queue';
import { LoadChangeDocument } from '../load/load.dto';

const { MongoError, ChangeStream } = mongo;

@Injectable()
export class TruckService implements OnApplicationBootstrap, OnModuleDestroy {
  private readonly trucksChangeStream?: InstanceType<typeof ChangeStream>;
  private trucksQueue?: Queue<ChangeDocument & TruckChangeDocument>;
  private readonly nearByRedundancyFactor: number;
  private readonly resetToAvailableOlderThen: number;
  private readonly locationUpdatedLaterThen: number;
  constructor(
    @InjectModel(Truck.name, MONGO_CONNECTION_NAME)
    private readonly truckModel: PaginateModel<TruckDocument>,
    private readonly geoApiService: GoogleGeoApiService,
    private readonly pushService: PushService,
    private readonly configService: ConfigService,
    private readonly log: LoggerService,
    private schedulerRegistry: SchedulerRegistry,
  ) {
    this.nearByRedundancyFactor =
      this.configService.get<number>('trucks.nearByRedundancyFactor') || 0;
    this.resetToAvailableOlderThen = configService.get<number>(
      'trucks.resetToAvailableWillBeOlderThen',
    ) as number;
    this.locationUpdatedLaterThen = configService.get<number>(
      'trucks.sendRenewLocationPushOlderThen',
    ) as number;
    this.trucksChangeStream = truckModel.watch([
      {
        $match: {
          $or: [
            {
              operationType: 'insert',
              $or: [
                {
                  'fullDocument.availabilityAtLocal': {
                    $exists: true,
                    $ne: null,
                  },
                },
                {
                  'fullDocument.availabilityLocation': {
                    $exists: true,
                    $ne: null,
                  },
                },
              ],
            },
            {
              operationType: 'update',
              $or: [
                {
                  'updateDescription.updatedFields.availabilityAtLocal': {
                    $exists: true,
                    $ne: null,
                  },
                },
                {
                  'updateDescription.updatedFields.availabilityLocation': {
                    $exists: true,
                    $ne: null,
                  },
                },
              ],
            },
          ],
        },
      },
      {
        $project: {
          operationType: 1,
          'documentKey._id': 1,
          'fullDocument.__v': 1,
          'updateDescription.updatedFields.__v': 1,
        },
      },
    ]);
  }

  onApplicationBootstrap(): void {
    this.log.debug('Creating queue');
    const stream = this?.trucksChangeStream;
    if (stream) {
      this.trucksQueue = new Queue<ChangeDocument & TruckChangeDocument>(
        async (): Promise<ChangeDocument & TruckChangeDocument> => {
          await stream.hasNext();
          return stream.next() as unknown as Promise<
            ChangeDocument & TruckChangeDocument
          >;
        },
        this.onNewTruck.bind(this),
        this.configService.get<number>('truckQueue.maxParallelTasks') as number,
        this.configService.get<number>('truckQueue.taskTimeout') as number,
        this.log || console.log,
      );
    }

    this.log.debug('Starting set "Available" job');
    const restartSetAvailableIntervalValue = this.configService.get<number>(
      'trucks.taskSetAvailableInterval',
    ) as number;
    const setAvailInterval = setInterval(() => {
      this.resetToAvailableStatus.bind(this)();
    }, restartSetAvailableIntervalValue);
    this.schedulerRegistry.addInterval(
      TRUCK_SET_AVAIL_STATUS_JOB,
      setAvailInterval,
    );

    this.log.debug('Starting send renew location push job');
    const restartSendPushIntervalValue = this.configService.get<number>(
      'trucks.taskSendRenewLocationPushInterval',
    ) as number;
    const setSendPushInterval = setInterval(() => {
      this.sendRenewLocationPush.bind(this)();
    }, restartSendPushIntervalValue);
    this.schedulerRegistry.addInterval(
      TRUCK_SEND_RENEW_LOCATION_PUSH_JOB,
      setSendPushInterval,
    );
  }

  async onModuleDestroy(): Promise<void> {
    this.log.debug('Stopping queue');
    await this?.trucksQueue?.stop();
    this.log.debug('Closing change stream');
    await this?.trucksChangeStream?.close();
    this.log.debug('Truck change stream is closed');
    this.log.debug('Stopping set "Available" status job');
    clearInterval(
      this.schedulerRegistry.getInterval(TRUCK_SET_AVAIL_STATUS_JOB),
    );
    this.log.debug('Stopping send update location push job');
    clearInterval(
      this.schedulerRegistry.getInterval(TRUCK_SEND_RENEW_LOCATION_PUSH_JOB),
    );
  }

  private async onNewTruck(change: ChangeDocument & LoadChangeDocument) {
    this.log.info(`Change ${JSON.stringify(change)}`);
    const version =
      (change.operationType === 'update' &&
        change?.updateDescription?.updatedFields?.__v) ||
      (change.operationType === 'insert' && change?.fullDocument.__v);
    if (!version && version !== 0) {
      this.log.info('No version field in changed data');
      return;
    }
    const truck = await this.truckModel.findOneAndUpdate(
      {
        _id: change.documentKey._id,
        $or: [
          { availabilityAtVer: { $lte: version - 1 } },
          { availabilityAtVer: { $exists: false } },
        ],
      },
      [
        {
          $set: {
            availabilityAtVer: '$__v',
          },
        },
      ],
    );
    if (!truck) {
      this.log.info('Truck not found');
      return;
    }
    this.log.debug(
      `Availability data updated. Calculating "availabilityAt" for Truck ${truck._id.toString()}.`,
    );
    const location = truck.availabilityLocation;
    if (!location) {
      this.log.warn(`No will be available location in Truck ${truck._id}`);
    }
    const date = truck.availabilityAtLocal;
    if (!date) {
      this.log.warn('availabilityAtLocal is empty');
      return;
    }
    const timeZoneData = await this.geoApiService.getTimeZone(location, date);
    if (!timeZoneData) {
      this.log.warn('TimeZone is empty');
      return;
    }

    const correctedTimestamp = new Date(
      date.getTime() - (timeZoneData.offset + timeZoneData.dst) * 1000,
    );
    const correctedTimeZoneData = await this.geoApiService.getTimeZone(
      location,
      correctedTimestamp,
    );
    if (!correctedTimeZoneData) {
      this.log.warn('TimeZone is empty');
      return;
    }
    let availabilityCorrection = 0;
    if (timeZoneData.dst && !correctedTimeZoneData.dst) {
      availabilityCorrection = -timeZoneData.dst;
    }
    if (!timeZoneData.dst && correctedTimeZoneData.dst) {
      availabilityCorrection = correctedTimeZoneData.dst;
    }
    let availabilityAt: Date;
    if (availabilityCorrection) {
      availabilityAt = new Date(
        correctedTimestamp.getTime() + availabilityCorrection * 1000,
      );
    } else {
      availabilityAt = correctedTimestamp;
    }

    if (availabilityAt instanceof Date && !isNaN(availabilityAt.getTime())) {
      const updated = await this.truckModel.findOneAndUpdate(
        {
          _id: change.documentKey._id,
          availabilityAtVer: { $lte: truck.__v },
        },
        [
          {
            $set: {
              availabilityAtVer: truck.__v,
              availabilityAt,
            },
          },
        ],
      );
      if (updated) {
        this.log.debug(`Truck ${change.documentKey._id} updated`);
      } else {
        this.log.warn(`Truck ${change.documentKey._id} NOT updated`);
      }
    }
  }

  private async resetToAvailableStatus(): Promise<void> {
    this.log.info(
      'Setting "Available" status to "Will be available" from past',
    );
    const willBeAvailableLaterThenDate = new Date(
      Date.now() - this.resetToAvailableOlderThen,
    );
    this.log.info(
      `Try to set "Available" to trucks "Will be available" later then ${willBeAvailableLaterThenDate}`,
    );
    const result = await this.truckModel.updateMany(
      {
        status: { $eq: 'Will be available' },
        availabilityAt: { $lte: willBeAvailableLaterThenDate },
      },
      [
        {
          $set: {
            status: 'Available',
            searchLocation: '$lastLocation',
          },
        },
        {
          $unset: [
            'availabilityLocation',
            'availabilityAt',
            'availabilityAtLocal',
          ],
        },
      ],
    );
    this.log.info(
      `Updated ${result.modifiedCount === 1 ? '1 truck' : result.modifiedCount + ' trucks'} status`,
    );
    return;
  }

  private async sendRenewLocationPush(): Promise<void> {
    let wasFound = false;
    let processedCount = 0;
    this.log.info('Starting to find trucks and send push`s');
    do {
      const locationUpdatedLaterThenDate = new Date(
        Date.now() - this.locationUpdatedLaterThen,
      );
      this.log.info(
        `Finding truck with location updated later then ${locationUpdatedLaterThenDate}`,
      );
      const truck = await this.truckModel.findOneAndUpdate(
        {
          locationUpdatedAt: {
            $exists: true,
            $ne: null,
            $lte: locationUpdatedLaterThenDate,
          },
          $or: [
            { renewLocationPushMessageAt: { $exists: false } },
            { renewLocationPushMessageAt: { $eq: null } },
            {
              $expr: {
                $lt: ['$renewLocationPushMessageAt', '$locationUpdatedAt'],
              },
            },
          ],
        },
        [
          {
            $set: {
              renewLocationPushMessageAt: new Date(),
              status: 'Not Available',
            },
          },
        ],
      );
      if (truck) {
        this.log.info(
          `Found truck: ${truck._id} with location updated ${truck.locationUpdatedAt}`,
        );
        wasFound = true;
        const driverId = truck.driver?._id.toString();
        if (driverId) {
          const newPushMessage = await this.pushService.createPush({
            to: driverId,
            title: 'Please log in',
            body: 'You need to log in to app to update location',
          });
          await this.pushService.updatePush(newPushMessage.id, {
            state: 'Ready for send',
          });
        }
        ++processedCount;
      } else {
        wasFound = false;
      }
    } while (wasFound);
    this.log.info(`Processed count ${processedCount}`);
    return;
  }

  private async findTruckDocumentById(id: string): Promise<TruckDocument> {
    this.log.debug(`Searching for Truck ${id}`);
    const truck = await this.truckModel.findOne({ _id: id });
    if (!truck) {
      throw new NotFoundException(`Truck ${id} was not found`);
    }
    this.log.debug(`Truck ${truck._id}`);

    return truck;
  }

  private async findTruckDocumentByNumber(
    truckNumber: number,
  ): Promise<TruckDocument> {
    this.log.debug(`Searching for Truck by number ${truckNumber}`);
    const truck = await this.truckModel.findOne({ truckNumber });
    if (!truck) {
      throw new NotFoundException(
        `Truck with number ${truckNumber} was not found`,
      );
    }
    this.log.debug(`Truck ${truck._id}`);

    return truck;
  }

  async findTruckById(id: string): Promise<TruckResultDto> {
    const truck = await this.findTruckDocumentById(id);
    return TruckResultDto.fromTruckModel(truck);
  }

  async findTruckByNumber(truckNumber: number): Promise<TruckResultDto> {
    const truck = await this.findTruckDocumentByNumber(truckNumber);
    return TruckResultDto.fromTruckModel(truck);
  }

  async getTrucks(query: TruckQuery): Promise<PaginatedTruckResultDto> {
    this.log.debug(`Searching for Trucks: ${JSON.stringify(query)}`);

    const documentQuery: Parameters<typeof this.truckModel.paginate>[0] = {};
    if (query.search) {
      const searchParams = Object.entries(query.search);
      searchParams.forEach((entry) => {
        entry[0] !== 'availableBefore' &&
          entry[0] !== 'availableAfter' &&
          entry[0] !== 'status' &&
          entry[0] !== 'lastLocation' &&
          entry[0] !== 'distance' &&
          entry[0] !== 'truckNumber' &&
          entry[0] !== 'search' &&
          (documentQuery[entry[0]] = {
            $regex: new RegExp(escapeForRegExp(entry[1]), 'i'),
          });
      });
    }
    const andParts = [];
    let andAvailableDateQueryPart = null;
    let otherStatusQueryPart = null;
    if (
      (query?.search?.availableBefore || query?.search?.availableAfter) &&
      (!query?.search?.status ||
        query?.search?.status.includes('Will be available'))
    ) {
      const andSubPart = [];
      andSubPart.push({ status: 'Will be available' });
      if (query?.search?.availableBefore) {
        andSubPart.push({
          availabilityAt: { $lte: query.search.availableBefore },
        });
      }
      if (query?.search?.availableAfter) {
        andSubPart.push({
          availabilityAt: { $gte: query.search.availableAfter },
        });
      }
      andAvailableDateQueryPart = {
        $and: andSubPart,
      };
    }
    if (query?.search?.status) {
      if (
        andAvailableDateQueryPart &&
        query.search.status.filter(
          (statusItem) => statusItem !== 'Will be available',
        ).length
      ) {
        otherStatusQueryPart = {
          status: {
            $in: query.search.status.filter(
              (statusItem) => statusItem !== 'Will be available',
            ),
          },
        };
      } else if (!andAvailableDateQueryPart) {
        otherStatusQueryPart = { status: { $in: query.search.status } };
      }
    } else if (andAvailableDateQueryPart) {
      otherStatusQueryPart = { status: { $ne: 'Will be available' } };
    }
    if (andAvailableDateQueryPart && otherStatusQueryPart) {
      andParts.push({ $or: [andAvailableDateQueryPart, otherStatusQueryPart] });
    } else if (andAvailableDateQueryPart) {
      andParts.push(andAvailableDateQueryPart);
    } else if (otherStatusQueryPart) {
      documentQuery.status = otherStatusQueryPart.status;
    }
    if (query?.search?.lastLocation && query?.search?.distance) {
      documentQuery.searchLocation = {
        $nearSphere: [
          query.search.lastLocation[1],
          query.search.lastLocation[0],
        ],
        $maxDistance: query.search.distance / EARTH_RADIUS_MILES,
      };
    }
    if (query?.search?.truckNumber) {
      documentQuery.truckNumber = {
        $eq: query.search.truckNumber,
      };
    }
    if (query?.search?.search) {
      const searchOrQueryPart = [];
      const search = escapeForRegExp(query?.search?.search);
      searchOrQueryPart.push({ vinCode: { $regex: new RegExp(search, 'i') } });
      searchOrQueryPart.push({
        licencePlate: { $regex: new RegExp(search, 'i') },
      });
      if (Number.isFinite(+search) && !Number.isNaN(+search)) {
        searchOrQueryPart.push({
          $expr: {
            $regexMatch: {
              input: { $toString: '$truckNumber' },
              regex: new RegExp(search, 'i'),
            },
          },
        });
      }
      andParts.push({ $or: searchOrQueryPart });
    }
    if (andParts.length > 1) {
      documentQuery.$and = andParts;
    } else if (andParts.length === 1) {
      Object.assign(documentQuery, andParts[0]);
    }
    const options: PaginateOptions = {
      limit: query.limit,
      offset: query.offset,
      forceCountFn: true,
    };

    if (query.direction && query.orderby) {
      options.sort = { [query.orderby]: query.direction };
    } else if (
      documentQuery.lastLocation &&
      options.limit !== undefined &&
      options.offset !== undefined &&
      this.nearByRedundancyFactor > 0
    ) {
      const addNum = Math.ceil(
        (options.limit * this.nearByRedundancyFactor) / 100,
      );
      const oldOffset = options.offset;
      const newOffset = oldOffset - addNum;
      options.offset = newOffset >= 0 ? newOffset : 0;
      options.limit =
        options.limit + (options.offset ? addNum : oldOffset) + addNum;
    }

    this.log.debug('Requesting paginated trucks');
    const res = await this.truckModel.paginate(documentQuery, options);

    let haversineDistances: CalculatedDistances;
    let roadsDistances: CalculatedDistances;
    if (query?.search?.lastLocation) {
      this.log.debug('Calculating haversine distance');
      haversineDistances = res.docs.map(
        (truck) =>
          truck.searchLocation &&
          query?.search?.lastLocation &&
          calcDistance(truck.searchLocation, query.search.lastLocation),
      );
      this.log.debug('Calculating distance by roads');
      roadsDistances = await Promise.all(
        res.docs.map(
          (truck) =>
            truck.searchLocation &&
            query?.search?.lastLocation &&
            this.geoApiService.getDistance(
              truck.searchLocation,
              query.search.lastLocation,
            ),
        ),
      );
    }

    let result = PaginatedTruckResultDto.from(
      res,
      haversineDistances,
      roadsDistances,
    );
    if (!options.sort && query?.search?.lastLocation) {
      this.log.debug('Sorting result items');
      result.items.sort(
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-expect-error
        (itemA, itemB) => itemA.milesByRoads - itemB.milesByRoads,
      );
    }
    if (
      (query.limit < result.limit && query.offset >= result.offset) ||
      (query.offset > result.offset && query.limit <= result.limit)
    ) {
      const newOffset = query.offset;
      const newLimit = query.limit;
      const offsetDiff = query.offset - result.offset;
      if (offsetDiff > 0) {
        result.items.splice(0, offsetDiff);
      }
      result.items.length =
        result.items.length < query.limit ? result.items.length : query.limit;
      result = { ...result, offset: newOffset, limit: newLimit };
    }
    this.log.debug('Returning results');
    return result;
  }

  async getTrucksForMap(): Promise<TruckResultForMapDto[]> {
    this.log.debug('Searching for Trucks for map');

    const res = await this.truckModel
      .find(
        { lastLocation: { $exists: true } },
        ['truckNumber', 'status', 'lastLocation'],
        {
          autopopulate: false,
        },
      )
      .exec();
    /*.populate({
        path: 'lastCity',
        options: { autopopulate: false },
      })
      .populate({
        path: 'owner',
        select: ['fullName', 'type', 'phone'],
        options: { autopopulate: false },
      })
      .populate({
        path: 'coordinator',
        select: ['fullName', 'type', 'phone'],
        options: { autopopulate: false },
      })*/
    return res.map((truck) => TruckResultForMapDto.fromTruckForMapModel(truck));
  }

  async createTruck(
    createTruckDto: CreateTruckDto,
    user?: UserResultDto,
  ): Promise<TruckResultDto> {
    this.log.debug(`Creating new Truck: ${JSON.stringify(createTruckDto)}`);
    // Will be available data check
    if (
      createTruckDto?.status === 'Will be available' &&
      !(
        createTruckDto?.availabilityLocation &&
        createTruckDto?.availabilityAtLocal
      )
    ) {
      throw new PreconditionFailedException(
        'Status must be "Will be available" and fields "availabilityLocation" and "availabilityAtLocal" must be present',
      );
    }

    const truck = new this.truckModel(createTruckDto);
    // Set reserved data
    if (createTruckDto.reservedAt && user) {
      Object.assign(truck, { reservedBy: user.id });
    }
    if (createTruckDto.reservedAt === null || !user) {
      Object.assign(truck, { reservedAt: undefined, reservedBy: undefined });
    }
    // Set Will be available data
    if (
      createTruckDto.availabilityAtLocal ||
      createTruckDto.availabilityLocation
    ) {
      Object.assign(truck, { availabilityAt: undefined });
    }
    if (createTruckDto.availabilityLocation) {
      Object.assign(truck, {
        searchLocation: createTruckDto.availabilityLocation,
      });
    }
    if (createTruckDto.status !== 'Will be available') {
      Object.assign(truck, { availabilityLocation: undefined });
      Object.assign(truck, { availabilityAt: undefined });
      Object.assign(truck, { availabilityAtLocal: undefined });
      if (truck.lastLocation) {
        Object.assign(truck, { searchLocation: truck.lastLocation });
      } else {
        Object.assign(truck, { searchLocation: undefined });
      }
    }

    try {
      this.log.debug('Saving Truck');
      const createdTruck = await truck.save();
      return TruckResultDto.fromTruckModel(createdTruck);
    } catch (e) {
      if (!(e instanceof Error)) {
        throw new InternalServerErrorException(JSON.stringify(e));
      }
      if (e instanceof MongoError && e.code === MONGO_UNIQUE_INDEX_CONFLICT) {
        throw new ConflictException({ type: UNIQUE_CONSTRAIN_ERROR, e });
      }
      throw new InternalServerErrorException(e.message);
    }
  }

  async updateTruck(
    id: string,
    updateTruckDto: UpdateTruckDto,
    user?: UserResultDto,
  ): Promise<TruckResultDto> {
    const truck = await this.findTruckDocumentById(id);
    const currentTruckStatus = truck.status;
    const newTruckStatus = updateTruckDto.status;
    this.log.debug(`Setting new values: ${JSON.stringify(updateTruckDto)}`);
    // Will be available data check
    if (
      updateTruckDto?.status === 'Will be available' &&
      !(
        updateTruckDto?.availabilityLocation &&
        updateTruckDto?.availabilityAtLocal
      ) &&
      !(updateTruckDto?.status === truck.status)
    ) {
      throw new PreconditionFailedException(
        'If new status is "Will be available" then there must be values for fields "availabilityLocation" and "availabilityAt"',
      );
    }
    // Set Search location
    if (
      updateTruckDto.lastLocation &&
      currentTruckStatus !== 'Will be available' &&
      !newTruckStatus
    ) {
      Object.assign(truck, {
        searchLocation: updateTruckDto.lastLocation,
      });
    }
    Object.assign(truck, updateTruckDto);
    if (updateTruckDto.lastLocation) {
      Object.assign(truck, { locationUpdatedAt: new Date() });
    }
    // Set reserved data
    if (updateTruckDto.reservedAt && user) {
      Object.assign(truck, { reservedBy: user.id });
    }
    if (updateTruckDto.reservedAt === null || !user) {
      Object.assign(truck, { reservedAt: undefined, reservedBy: undefined });
    }
    // Set Will be available data
    if (
      updateTruckDto.availabilityAtLocal ||
      updateTruckDto.availabilityLocation
    ) {
      Object.assign(truck, { availabilityAt: undefined });
    }
    if (
      updateTruckDto.availabilityLocation &&
      newTruckStatus === 'Will be available' &&
      currentTruckStatus !== newTruckStatus
    ) {
      Object.assign(truck, {
        searchLocation: updateTruckDto.availabilityLocation,
      });
    }
    if (
      currentTruckStatus === 'Will be available' &&
      currentTruckStatus !== newTruckStatus &&
      newTruckStatus
    ) {
      Object.assign(truck, { availabilityLocation: undefined });
      Object.assign(truck, { availabilityAt: undefined });
      Object.assign(truck, { availabilityAtLocal: undefined });
      if (truck.lastLocation) {
        Object.assign(truck, { searchLocation: truck.lastLocation });
      } else {
        Object.assign(truck, { searchLocation: undefined });
      }
    }

    try {
      this.log.debug('Saving Truck');
      const savedTruck = await truck.save();
      this.log.debug(`Truck ${savedTruck._id} saved`);
      return TruckResultDto.fromTruckModel(truck);
    } catch (e) {
      if (!(e instanceof Error)) {
        throw new InternalServerErrorException(JSON.stringify(e));
      }
      if (e instanceof MongoError && e.code === MONGO_UNIQUE_INDEX_CONFLICT) {
        throw new ConflictException({ type: UNIQUE_CONSTRAIN_ERROR, e });
      }
      throw new InternalServerErrorException(e.message);
    }
  }

  async deleteTruck(id: string): Promise<TruckResultDto> {
    const truck = await this.findTruckDocumentById(id);

    this.log.debug(`Deleting Truck ${truck._id}`);

    try {
      await truck.deleteOne();
      this.log.debug('Truck deleted');
    } catch (e) {
      if (!(e instanceof Error)) {
        throw new InternalServerErrorException(JSON.stringify(e));
      }
      throw new InternalServerErrorException(e.message);
    }
    return TruckResultDto.fromTruckModel(truck);
  }
}
