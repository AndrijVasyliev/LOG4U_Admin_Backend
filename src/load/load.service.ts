import { mongo, PaginateModel, PaginateOptions, ObjectId } from 'mongoose';
import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ConfigService } from '@nestjs/config';
import { Load, LoadDocument, TimeFrameType } from './load.schema';
import {
  CreateLoadDto,
  StopChangeDocument,
  LoadChangeDocument,
  LoadQuery,
  LoadResultDto,
  PaginatedLoadResultDto,
  UpdateLoadDto,
} from './load.dto';
import { LoggerService } from '../logger';
import {
  MONGO_CONNECTION_NAME,
  MONGO_UNIQUE_INDEX_CONFLICT,
  UNIQUE_CONSTRAIN_ERROR,
} from '../utils/constants';
import { TruckService } from '../truck/truck.service';
import { GoogleGeoApiService } from '../googleGeoApi/googleGeoApi.service';
import { escapeForRegExp } from '../utils/escapeForRegExp';
import { ChangeDocument, Queue } from '../utils/queue';
import { GeoPointType, LoadStatus } from '../utils/general.dto';
import { PushService } from '../push/push.service';

const { MongoError, ChangeStream } = mongo;

@Injectable()
export class LoadService {
  private readonly stopsChangeStream?: InstanceType<typeof ChangeStream>;
  private readonly loadChangeStream?: InstanceType<typeof ChangeStream>;
  private stopsQueue?: Queue<ChangeDocument & StopChangeDocument>;
  private loadQueue?: Queue<ChangeDocument & LoadChangeDocument>;
  constructor(
    @InjectModel(Load.name, MONGO_CONNECTION_NAME)
    private readonly loadModel: PaginateModel<LoadDocument>,
    private readonly truckService: TruckService,
    private readonly geoApiService: GoogleGeoApiService,
    private readonly pushService: PushService,
    private readonly configService: ConfigService,
    private readonly log: LoggerService,
  ) {
    this.stopsChangeStream = loadModel.watch([
      {
        $match: {
          $or: [
            {
              operationType: 'insert',
              'fullDocument.stops': { $exists: true },
            },
            {
              operationType: 'update',
              'updateDescription.updatedFields.stops': { $exists: true },
            },
          ],
        },
      },
      {
        $project: {
          operationType: 1,
          'documentKey._id': 1,
          'fullDocument.__v': 1,
          // 'fullDocument.stops': 1,
          //'updateDescription.updatedFields.stops': 1,
          'updateDescription.updatedFields.__v': 1,
        },
      },
    ]);
    this.loadChangeStream = loadModel.watch(
      [
        {
          $match: {
            $or: [
              {
                operationType: 'insert',
                'fullDocument.truck': { $exists: true },
              },
              {
                operationType: 'update',
                $or: [
                  {
                    'updateDescription.updatedFields.status': { $exists: true },
                  },
                  {
                    'updateDescription.updatedFields.truck': { $exists: true },
                  },
                  { 'updateDescription.removedFields': 'truck' },
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
            'fullDocument.truck': 1,
            'fullDocument.status': 1,
            'fullDocumentBeforeChange.__v': 1,
            'fullDocumentBeforeChange.truck': 1,
            'fullDocumentBeforeChange.status': 1,
            'updateDescription.updatedFields.__v': 1,
            'updateDescription.updatedFields.truck': 1,
            'updateDescription.updatedFields.status': 1,
          },
        },
      ],
      {
        fullDocumentBeforeChange: 'whenAvailable',
        fullDocument: 'whenAvailable',
      },
    );
  }
  onApplicationBootstrap(): void {
    this.log.debug('Creating queue');
    const stopsStream = this?.stopsChangeStream;
    if (stopsStream) {
      this.stopsQueue = new Queue<ChangeDocument & StopChangeDocument>(
        async (): Promise<ChangeDocument & StopChangeDocument> => {
          await stopsStream.hasNext();
          return stopsStream.next() as unknown as Promise<
            ChangeDocument & StopChangeDocument
          >;
        },
        this.onNewStop.bind(this),
        this.configService.get<number>('loadQueue.maxParallelTasks') as number,
        this.configService.get<number>('loadQueue.taskTimeout') as number,
        this.log || console.log,
      );
    }
    const loadStream = this?.loadChangeStream;
    if (loadStream) {
      this.loadQueue = new Queue<ChangeDocument & LoadChangeDocument>(
        async (): Promise<ChangeDocument & LoadChangeDocument> => {
          await loadStream.hasNext();
          return loadStream.next() as unknown as Promise<
            ChangeDocument & LoadChangeDocument
          >;
        },
        this.onNewLoad.bind(this),
        this.configService.get<number>('loadQueue.maxParallelTasks') as number,
        this.configService.get<number>('loadQueue.taskTimeout') as number,
        this.log || console.log,
      );
    }
  }
  async onModuleDestroy(): Promise<void> {
    this.log.debug('Stopping queue');
    await this?.stopsQueue?.stop();
    await this?.loadQueue?.stop();
    this.log.debug('Closing change stream');
    await this?.stopsChangeStream?.close();
    this.log.debug('Load change stream is closed');
  }

  private async onNewStop(change: ChangeDocument & StopChangeDocument) {
    this.log.info(`Change ${JSON.stringify(change)}`);
    const version =
      (change.operationType === 'update' &&
        change?.updateDescription?.updatedFields?.__v) ||
      (change.operationType === 'insert' && change?.fullDocument.__v);
    if (!version && version !== 0) {
      this.log.info('No version field in changed data');
      return;
    }
    const load = await this.loadModel
      .findOneAndUpdate(
        {
          _id: change.documentKey._id,
          $or: [
            { stopsVer: { $lte: version - 1 } },
            { stopsVer: { $exists: false } },
          ],
        },
        [
          {
            $set: {
              stopsVer: '$__v', // Probably { $subtract: ['$__v', 0.5] },
            },
          },
          /*{
            $unset: ['miles'], // ToDo probably null this on update stops field
          },*/
        ],
      )
      .populate('stops');
    if (!load) {
      this.log.info('Load not found');
      return;
    }

    const stops = load.stops;
    const firstStop = stops?.at(0);
    const lastStop = stops?.at(-1);
    const stopsStart =
      firstStop &&
      (firstStop.timeFrame.type === TimeFrameType.FCFS
        ? firstStop.timeFrame.from
        : firstStop.timeFrame.at);
    const stopsEnd =
      lastStop &&
      (lastStop.timeFrame.type === TimeFrameType.FCFS
        ? lastStop.timeFrame.to
        : lastStop.timeFrame.at);

    this.log.debug(
      `Stops updated. Calculating distance for Load ${load._id.toString()}.`,
    );
    let miles: number | null = 0;
    let prevStopLocation: GeoPointType | undefined = undefined;
    this.log.debug('Calculating distance by roads');
    for (const stop of stops) {
      if (prevStopLocation) {
        const partRouteLength = await this.geoApiService.getDistance(
          prevStopLocation,
          stop.facility.facilityLocation,
        );
        if (partRouteLength === undefined) {
          miles = null;
          break;
        }
        miles += Number(partRouteLength);
      }
      prevStopLocation = stop.facility.facilityLocation;
    }
    this.log.debug(`Calculated distance: ${miles}`);
    const updated = await this.loadModel.findOneAndUpdate(
      {
        _id: change.documentKey._id,
        stopsVer: { $lte: load.__v },
      },
      [
        {
          $set: {
            stopsVer: load.__v,
            miles,
            stopsStart,
            stopsEnd,
          },
        },
      ],
    );
    if (updated) {
      this.log.debug(`Load ${change.documentKey._id} updated`);
    } else {
      this.log.warn(`Load ${change.documentKey._id} NOT updated`);
    }
  }
  private async onNewLoad(change: ChangeDocument & LoadChangeDocument) {
    this.log.info(`Change ${JSON.stringify(change)}`);
    const version =
      (change.operationType === 'update' &&
        change?.updateDescription?.updatedFields?.__v) ||
      (change.operationType === 'insert' && change?.fullDocument.__v);
    if (!version && version !== 0) {
      this.log.info('No version field in changed data');
      return;
    }
    const load = await this.loadModel.findOneAndUpdate(
      {
        _id: change.documentKey._id,
        $or: [
          { statusVer: { $lte: version - 1 } },
          { statusVer: { $exists: false } },
        ],
      },
      [
        {
          $set: {
            statusVer: '$__v',
          },
        },
      ],
    );
    if (!load) {
      this.log.info('Load not found');
      return;
    }

    let oldTruckActivatedLoadId: ObjectId | null = null;
    let newTruckActivatedLoadId: ObjectId | null = null;
    let currentTruckLoadUpdateInvoked = false;

    const truckIdsToOnRoute = new Set<string>();
    const truckIdsToAvailable = new Set<string>();

    if (
      change.operationType === 'update' &&
      change.fullDocument.status !== change.fullDocumentBeforeChange.status &&
      change.fullDocument.truck?.toString() ===
        change.fullDocumentBeforeChange.truck?.toString() &&
      change.fullDocument.truck &&
      change.fullDocumentBeforeChange.status === 'In Progress'
    ) {
      currentTruckLoadUpdateInvoked = true;
      const loadToInProgress = await this.loadModel
        .findOne({
          status: 'Planned',
          truck: change.fullDocument.truck,
        })
        .sort({ stopsStart: 1 });
      if (loadToInProgress) {
        this.log.debug(
          `Changing load status from ${loadToInProgress.status} to In Progress for ${loadToInProgress._id}`,
        );
        loadToInProgress.set('status', 'In Progress');
        await loadToInProgress.save();
        newTruckActivatedLoadId = loadToInProgress._id;
        this.log.debug(`Load ${loadToInProgress._id} saved`);
      } else {
        truckIdsToAvailable.add(change.fullDocument.truck.toString());
      }
    }

    if (
      change.operationType === 'update' &&
      change.fullDocument.truck?.toString() !==
        change.fullDocumentBeforeChange.truck?.toString() &&
      change.fullDocumentBeforeChange.truck &&
      change.fullDocumentBeforeChange.status === 'In Progress'
    ) {
      const loadToInProgress = await this.loadModel
        .findOne({
          status: 'Planned',
          truck: change.fullDocumentBeforeChange.truck,
        })
        .sort({ stopsStart: 1 });
      if (loadToInProgress) {
        this.log.debug(
          `Changing load status from ${loadToInProgress.status} to In Progress for ${loadToInProgress._id}`,
        );
        loadToInProgress.set('status', 'In Progress');
        await loadToInProgress.save();
        oldTruckActivatedLoadId = loadToInProgress._id;
        this.log.debug(`Load ${loadToInProgress._id} saved`);
      } else {
        truckIdsToAvailable.add(
          change.fullDocumentBeforeChange.truck.toString(),
        );
      }
    }

    if (
      ((change.operationType === 'update' &&
        (change.fullDocument.truck?.toString() !==
          change.fullDocumentBeforeChange.truck?.toString() ||
          change.fullDocument.status !==
            change.fullDocumentBeforeChange.status) &&
        newTruckActivatedLoadId?.toString() !==
          change.documentKey._id?.toString()) ||
        (change.operationType === 'insert' && change.fullDocument.truck)) &&
      change.fullDocument.status !== 'TONU' &&
      change.fullDocument.status !== 'Cancelled' &&
      change.fullDocument.status !== 'Completed'
    ) {
      this.log.debug(
        `Will recalculate status for load ${change.documentKey._id}`,
      );
      let newLoadStatus: LoadStatus;
      if (!change.fullDocument.truck) {
        newLoadStatus = 'Available';
      } else if (
        currentTruckLoadUpdateInvoked &&
        newTruckActivatedLoadId?.toString() !==
          change.documentKey._id?.toString()
      ) {
        newLoadStatus = 'Planned';
      } else {
        const loadInProgress = await this.loadModel.findOne({
          _id: { $ne: change.documentKey._id },
          status: 'In Progress',
          truck: change.fullDocument.truck,
        });
        newLoadStatus = loadInProgress ? 'Planned' : 'In Progress';
      }
      if (load.status !== newLoadStatus) {
        this.log.debug(
          `Changing load status from ${load.status} to ${newLoadStatus}`,
        );
        if (change.fullDocument.truck && newLoadStatus === 'In Progress') {
          newTruckActivatedLoadId = change.documentKey._id;
          truckIdsToOnRoute.add(change.fullDocument.truck.toString());
          truckIdsToAvailable.delete(change.fullDocument.truck.toString());
        }

        const updated = await this.loadModel.findOneAndUpdate(
          {
            _id: change.documentKey._id,
            statusVer: { $lte: load.__v },
          },
          [
            {
              $set: {
                statusVer: load.__v,
                status: newLoadStatus,
              },
            },
          ],
        );
        if (updated) {
          this.log.debug(`Load ${change.documentKey._id} updated`);
        } else {
          this.log.warn(`Load ${change.documentKey._id} NOT updated`);
        }
      }
    }

    if (
      ((change.operationType === 'update' &&
        (change.fullDocument.truck?.toString() !==
          change.fullDocumentBeforeChange.truck?.toString() ||
          change.fullDocument.status !==
            change.fullDocumentBeforeChange.status)) ||
        change.operationType === 'insert') &&
      change.fullDocument.status === 'In Progress' &&
      change.fullDocument.truck
    ) {
      truckIdsToOnRoute.add(change.fullDocument.truck.toString());
    }

    if (truckIdsToAvailable.size > 0) {
      for (const truckId of truckIdsToAvailable) {
        this.log.debug(`Setting Available state to truck ${truckId}`);
        await this.truckService.updateTruck(truckId, {
          status: 'Available',
        });
        this.log.debug(`Truck ${truckId} updated`);
      }
    }
    if (truckIdsToOnRoute.size > 0) {
      for (const truckId of truckIdsToOnRoute) {
        this.log.debug(`Setting On route state to truck ${truckId}`);
        await this.truckService.updateTruck(truckId, {
          status: 'On route',
        });
        this.log.debug(`Truck ${truckId} updated`);
      }
    }

    if (
      ((change.operationType === 'update' &&
        (change.fullDocument.truck?.toString() !==
          change.fullDocumentBeforeChange.truck?.toString() ||
          change.fullDocument.status !==
            change.fullDocumentBeforeChange.status)) ||
        change.operationType === 'insert') &&
      change.fullDocument.truck &&
      (change.fullDocument.status === 'In Progress' ||
        newTruckActivatedLoadId?.toString() ===
          change.documentKey._id?.toString())
    ) {
      this.log.debug(
        `Load ${change.documentKey._id} in progress is now on truck ${change.fullDocument.truck}`,
      );

      const truck = await this.truckService.findTruckById(
        change.fullDocument.truck,
      );
      if (truck && truck.driver) {
        const newPushMessage = await this.pushService.createPush({
          to: truck.driver.id,
          title: 'New load is assigned.',
          body: `Load #${load.loadNumber} is assigned to truck #${truck.truckNumber} and transferred to "In Progress".`,
          data: {
            routeTo: `/home/loads?selectedLoadId=${change.documentKey._id}&renew=data`,
          },
        });
        await this.pushService.updatePush(newPushMessage.id, {
          state: 'Ready for send',
        });
      } else {
        this.log.warn(
          `Truck ${change.fullDocument.truck} not found or have no driver assigned`,
        );
      }
    }
  }

  private async findLoadDocumentById(id: string): Promise<LoadDocument> {
    this.log.debug(`Searching for Load ${id}`);
    const load = await this.loadModel.findOne({ _id: id });
    if (!load) {
      throw new NotFoundException(`Load ${id} was not found`);
    }
    this.log.debug(`Load ${load._id}`);
    return load;
  }

  async findLoadById(id: string): Promise<LoadResultDto> {
    const load = await this.findLoadDocumentById(id);
    return LoadResultDto.fromLoadModel(load);
  }

  async getLoads(query: LoadQuery): Promise<PaginatedLoadResultDto> {
    this.log.debug(`Searching for Loads: ${JSON.stringify(query)}`);

    const documentQuery: Parameters<typeof this.loadModel.paginate>[0] = {};
    if (query.search) {
      const searchParams = Object.entries(query.search);
      searchParams.forEach((entry) => {
        entry[0] !== 'loadNumber' &&
          entry[0] !== 'truckNumber' &&
          (documentQuery[entry[0]] = {
            $regex: new RegExp(escapeForRegExp(entry[1]), 'i'),
          });
      });
    }
    if (query?.search?.loadNumber) {
      documentQuery.loadNumber = {
        $eq: query.search.loadNumber,
      };
    }
    if (query?.search?.truckNumber) {
      const truck = await this.truckService.findTruckByNumber(
        query.search.truckNumber,
      );
      documentQuery.truck = {
        $eq: truck.id,
      };
    }

    const options: PaginateOptions = {
      limit: query.limit,
      offset: query.offset,
    };
    if (query.direction && query.orderby) {
      options.sort = { [query.orderby]: query.direction };
    }
    const res = await this.loadModel.paginate(documentQuery, options);

    return PaginatedLoadResultDto.from(res);
  }

  async createLoad(createLoadDto: CreateLoadDto): Promise<LoadResultDto> {
    this.log.debug(`Creating new Load: ${JSON.stringify(createLoadDto)}`);

    const lastLoadNumber = await this.loadModel
      .findOne({}, { loadNumber: 1 }, { sort: { loadNumber: -1 } })
      .lean();
    const createdLoad = new this.loadModel({
      ...createLoadDto,
      loadNumber: lastLoadNumber?.loadNumber
        ? lastLoadNumber.loadNumber + 1
        : 1,
    });

    try {
      this.log.debug('Saving Load');
      await createdLoad.save();

      // Calculate Truck Id to update status
      /*let truckIdToOnRoute: string | undefined;
      if (createLoadDto.status === 'In Progress' && createLoadDto.truck) {
        truckIdToOnRoute = createLoadDto.truck;
      }
      if (truckIdToOnRoute) {
        this.truckService
          .updateTruck(truckIdToOnRoute, { status: 'On route' })
          .then(() =>
            this.log.info(`Status "On route" set to truck ${truckIdToOnRoute}`),
          );
      }*/

      return LoadResultDto.fromLoadModel(createdLoad);
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

  async updateLoad(
    id: string,
    updateLoadDto: UpdateLoadDto,
  ): Promise<LoadResultDto> {
    const load = await this.findLoadDocumentById(id);
    // const currentLoadStops = load.stops;
    // const newLoadStops = updateLoadDto.stops;
    // const currentLoadStatus = load.status;
    // const newLoadStatus = updateLoadDto.status;
    // const currentLoadTruckId = load.truck?._id.toString();
    // const newLoadTruckId = updateLoadDto.truck;
    this.log.debug(`Setting new values: ${JSON.stringify(updateLoadDto)}`);
    Object.assign(load, {
      ...updateLoadDto,
    });
    /*if () {
      Object.assign(load, { miles: undefined });
    }*/

    try {
      this.log.debug('Saving Load');
      await (await load.save()).populate('stops.facility');
      this.log.debug(`Load ${load._id} saved`);

      // Calculate Truck Id to update status
      /*let truckIdToOnRoute: string | undefined;
      let truckIdToAvailable: string | undefined;
      if (
        newLoadStatus === 'In Progress' &&
        newLoadStatus !== currentLoadStatus &&
        (newLoadTruckId === undefined || newLoadTruckId === currentLoadTruckId)
      ) {
        truckIdToOnRoute = currentLoadTruckId;
      }
      if (
        currentLoadStatus === 'In Progress' &&
        newLoadStatus !== currentLoadStatus &&
        (newLoadTruckId === undefined || newLoadTruckId === currentLoadTruckId)
      ) {
        truckIdToAvailable = currentLoadTruckId;
      }
      if (
        newLoadTruckId !== currentLoadTruckId &&
        (newLoadStatus === undefined || newLoadStatus === currentLoadStatus) &&
        currentLoadStatus === 'In Progress'
      ) {
        truckIdToOnRoute = newLoadTruckId;
        truckIdToAvailable = currentLoadTruckId;
      }
      if (
        newLoadTruckId !== undefined &&
        newLoadStatus !== undefined &&
        newLoadTruckId !== currentLoadTruckId &&
        newLoadStatus !== currentLoadStatus &&
        currentLoadStatus === 'In Progress'
      ) {
        truckIdToAvailable = currentLoadTruckId;
      }
      if (
        newLoadTruckId !== undefined &&
        newLoadStatus !== undefined &&
        newLoadTruckId !== currentLoadTruckId &&
        newLoadStatus !== currentLoadStatus &&
        newLoadStatus === 'In Progress'
      ) {
        truckIdToOnRoute = newLoadTruckId;
      }

      if (truckIdToOnRoute) {
        this.truckService
          .updateTruck(truckIdToOnRoute, { status: 'On route' })
          .then(() =>
            this.log.info(`Status "On route" set to truck ${truckIdToOnRoute}`),
          );
      }
      if (truckIdToAvailable) {
        this.truckService
          .updateTruck(truckIdToAvailable, { status: 'Available' })
          .then(() =>
            this.log.info(
              `Status "Available" set to truck ${truckIdToAvailable}`,
            ),
          );
      }*/
      // END Calculate Truck Id to update status
      return LoadResultDto.fromLoadModel(load);
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

  async deleteLoad(id: string): Promise<LoadResultDto> {
    const load = await this.findLoadDocumentById(id);

    this.log.debug(`Deleting Load ${load._id}`);

    try {
      await load.deleteOne();
      this.log.debug('Load deleted');
    } catch (e) {
      if (!(e instanceof Error)) {
        throw new InternalServerErrorException(JSON.stringify(e));
      }
      throw new InternalServerErrorException(e.message);
    }
    return LoadResultDto.fromLoadModel(load);
  }
}
