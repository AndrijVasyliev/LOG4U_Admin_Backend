import { mongo, PaginateModel, PaginateOptions } from 'mongoose';
import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ConfigService } from '@nestjs/config';
import { Load, LoadDocument } from './load.schema';
import {
  CreateLoadDto,
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
import { GeoPointType } from '../utils/general.dto';

const { MongoError, ChangeStream } = mongo;

@Injectable()
export class LoadService {
  private readonly stopsChangeStream?: InstanceType<typeof ChangeStream>;
  private stopsQueue?: Queue<ChangeDocument & LoadChangeDocument>;
  constructor(
    @InjectModel(Load.name, MONGO_CONNECTION_NAME)
    private readonly loadModel: PaginateModel<LoadDocument>,
    private readonly truckService: TruckService,
    private readonly geoApiService: GoogleGeoApiService,
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
  }
  onApplicationBootstrap(): void {
    this.log.debug('Creating queue');
    const stream = this?.stopsChangeStream;
    if (stream) {
      this.stopsQueue = new Queue<ChangeDocument & LoadChangeDocument>(
        async (): Promise<ChangeDocument & LoadChangeDocument> => {
          await stream.hasNext();
          return stream.next() as unknown as Promise<
            ChangeDocument & LoadChangeDocument
          >;
        },
        this.onNewLoad.bind(this),
        this.configService.get<number>('emailQueue.maxParallelTasks') as number,
        this.configService.get<number>('emailQueue.taskTimeout') as number,
        this.log || console.log,
      );
    }
  }
  async onModuleDestroy(): Promise<void> {
    this.log.debug('Stopping queue');
    await this?.stopsQueue?.stop();
    this.log.debug('Closing change stream');
    await this?.stopsChangeStream?.close();
    this.log.debug('Load change stream is closed');
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
          {
            $unset: ['miles'],
          },
        ],
      )
      .populate('stops');
    if (!load) {
      this.log.info('Load not found');
      return;
    }
    this.log.debug(
      `Stops updated. Calculating distance for Load ${load._id.toString()}.`,
    );
    const stops = load.stops;
    let miles = 0;
    let prevStopLocation: GeoPointType | undefined = undefined;
    this.log.debug('Calculating distance by roads');
    for (const stop of stops) {
      if (prevStopLocation) {
        const partRouteLength = await this.geoApiService.getDistance(
          prevStopLocation,
          stop.facility.facilityLocation,
        );
        miles += Number(partRouteLength);
      }
      prevStopLocation = stop.facility.facilityLocation;
    }
    this.log.debug(`Calculated distance: ${miles}`);
    if (!Number.isNaN(miles)) {
      await this.loadModel.findOneAndUpdate(
        {
          _id: change.documentKey._id,
          stopsVer: { $lte: load.__v },
        },
        [
          {
            $set: {
              stopsVer: load.__v,
              miles,
            },
          },
        ],
      );
      this.log.debug('Load updated');
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
      /*let load = await createdLoad.save();
      this.log.debug('Calculating distance');
      const miles = await this.geoApiService.getDistance(
        [
          createdLoad.get('pick.geometry.location')?.lat,
          createdLoad.get('pick.geometry.location')?.lng,
        ],
        [
          createdLoad.get('deliver.geometry.location')?.lat,
          createdLoad.get('deliver.geometry.location')?.lng,
        ],
      );
      this.log.debug(`Updating Load: miles ${miles}`);
      createdLoad = await createdLoad.set('miles', miles).save();
      this.log.debug('Load updated');*/

      // Calculate Truck Id to update status
      let truckIdToOnRoute: string | undefined;
      if (createLoadDto.status === 'In Progress' && createLoadDto.truck) {
        truckIdToOnRoute = createLoadDto.truck;
      }
      if (truckIdToOnRoute) {
        this.truckService
          .updateTruck(truckIdToOnRoute, { status: 'On route' })
          .then(() =>
            this.log.info(`Status "On route" set to truck ${truckIdToOnRoute}`),
          );
      }

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
    const currentLoadStatus = load.status;
    const newLoadStatus = updateLoadDto.status;
    const currentLoadTruckId = load.truck?._id.toString();
    const newLoadTruckId = updateLoadDto.truck;
    this.log.debug(`Setting new values: ${JSON.stringify(updateLoadDto)}`);
    Object.assign(load, {
      ...updateLoadDto,
    });
    try {
      this.log.debug('Saving Load');
      await (await load.save()).populate('stops.facility');
      /*this.log.debug('Calculating distance');
      const miles = await this.geoApiService.getDistance(
        [
          load.get('pick.geometry.location')?.lat,
          load.get('pick.geometry.location')?.lng,
        ],
        [
          load.get('deliver.geometry.location')?.lat,
          load.get('deliver.geometry.location')?.lng,
        ],
      );
      this.log.debug(`Updating Load: miles ${miles}`);
      load = await load.set('miles', miles).save();*/
      this.log.debug(`Load ${load._id} saved`);

      // Calculate Truck Id to update status
      let truckIdToOnRoute: string | undefined;
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
      }

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
