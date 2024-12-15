import { PaginateModel, PaginateOptions, Types } from 'mongoose';
import {
  Injectable,
  NotFoundException,
  PreconditionFailedException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Load, LoadDocument, StopType } from './load.schema';
import {
  CreateLoadDto,
  LoadQuery,
  LoadResultDto,
  PaginatedLoadResultDto,
  UpdateLoadDto,
  UpdateLoadStopPickUpStatusDto,
  UpdateLoadStopDeliveryStatusDto,
  CreateStopPickUpDriversInfoDto,
  CreateStopDeliveryDriversInfoDto,
} from './load.dto';
import { LoggerService } from '../logger';
import {
  MONGO_CONNECTION_NAME,
  STOP_DELIVERY_STATUSES,
  STOP_PICKUP_STATUSES,
} from '../utils/constants';
import { TruckService } from '../truck/truck.service';
import { escapeForRegExp } from '../utils/escapeForRegExp';

@Injectable()
export class LoadService {
  constructor(
    @InjectModel(Load.name, MONGO_CONNECTION_NAME)
    private readonly loadModel: PaginateModel<LoadDocument>,
    private readonly truckService: TruckService,
    private readonly log: LoggerService,
  ) {}

  private async findLoadDocumentById(
    id: Types.ObjectId,
  ): Promise<LoadDocument> {
    this.log.debug(`Searching for Load ${id}`);
    const load = await this.loadModel.findOne({ _id: id });
    if (!load) {
      throw new NotFoundException(`Load ${id} was not found`);
    }
    this.log.debug(`Load ${load._id}`);
    return load;
  }

  async findLoadById(id: Types.ObjectId): Promise<LoadResultDto> {
    const load = await this.findLoadDocumentById(id);
    return LoadResultDto.fromLoadModel(load);
  }

  async getLoads(query: LoadQuery): Promise<PaginatedLoadResultDto> {
    this.log.debug(`Searching for Loads: ${JSON.stringify(query)}`);

    const documentQuery: Parameters<typeof this.loadModel.paginate>[0] = {};
    if (query.search) {
      const searchParams = Object.entries(query.search);
      searchParams.forEach((entry) => {
        entry[0] !== 'search' &&
          entry[0] !== 'status' &&
          entry[0] !== 'loadNumber' &&
          entry[0] !== 'truckNumber' &&
          entry[0] !== 'trucksIds' &&
          (documentQuery[entry[0]] = {
            $regex: new RegExp(escapeForRegExp(entry[1]), 'i'),
          });
      });
    }
    if (query?.search?.status) {
      documentQuery.status = {
        $in: query.search.status,
      };
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
    if (query?.search?.trucksIds) {
      documentQuery.truck = {
        $in: query?.search?.trucksIds,
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

    this.log.debug('Saving Load');
    await createdLoad.save();

    return LoadResultDto.fromLoadModel(createdLoad);
  }

  async updateLoad(
    id: Types.ObjectId,
    updateLoadDto: UpdateLoadDto,
  ): Promise<LoadResultDto> {
    const load = await this.findLoadDocumentById(id);

    this.log.debug(`Setting new values: ${JSON.stringify(updateLoadDto)}`);
    Object.assign(load, {
      ...updateLoadDto,
    });

    this.log.debug('Saving Load');
    await (await load.save()).populate('stops.facility');
    this.log.debug(`Load ${load._id} saved`);

    return LoadResultDto.fromLoadModel(load);
  }

  async updateLoadStopPickUpStatus(
    id: Types.ObjectId,
    stopId: Types.ObjectId,
    updateLoadStopPickUpStatusBodyDto: UpdateLoadStopPickUpStatusDto,
  ): Promise<LoadResultDto> {
    const load = await this.findLoadDocumentById(id);

    this.log.debug(
      `Setting new status ${updateLoadStopPickUpStatusBodyDto.status} for Stop ${stopId} in Load ${id}`,
    );

    const stopIndex = load.stops.findIndex(
      (stopItem) => stopItem.stopId === stopId,
    );
    if (!~stopIndex) {
      throw new PreconditionFailedException(`No Stop ${stopId} in Load ${id}`);
    }
    const stop = load.stops[stopIndex];
    if (stop.type !== StopType.PickUp) {
      throw new PreconditionFailedException(
        `Stop ${stopId} in Load ${id} has wrong type: ${stop.type}`,
      );
    }

    const oldStopStatus = stop.status;
    const newStopStatus = updateLoadStopPickUpStatusBodyDto.status;
    const oldStopStatusIndex = STOP_PICKUP_STATUSES.findIndex(
      (status) => status === oldStopStatus,
    );
    const newStopStatusIndex = STOP_PICKUP_STATUSES.findIndex(
      (status) => status === newStopStatus,
    );
    if (Math.abs(oldStopStatusIndex - newStopStatusIndex) !== 1) {
      throw new PreconditionFailedException(
        `Stop status can be changed only sequentially. Got ${oldStopStatus} -> ${newStopStatus}`,
      );
    }

    stop.set('status', newStopStatus);

    /*if (
      newStopStatusIndex === STOP_PICKUP_STATUSES.length - 1 &&
      stopIndex !== load.stops.length - 1
    ) {
      const nextStop = load.stops[stopIndex + 1];
      switch (nextStop.type) {
        case StopType.PickUp:
          nextStop.set('status', STOP_PICKUP_STATUSES[1]);
          break;
        case StopType.Delivery:
          nextStop.set('status', STOP_DELIVERY_STATUSES[1]);
          break;
      }
    }*/

    await load.save();

    return LoadResultDto.fromLoadModel(load);
  }

  async updateLoadStopDeliveryStatus(
    id: Types.ObjectId,
    stopId: Types.ObjectId,
    updateLoadStopDeliveryStatusBodyDto: UpdateLoadStopDeliveryStatusDto,
  ): Promise<LoadResultDto> {
    const load = await this.findLoadDocumentById(id);

    this.log.debug(
      `Setting new status ${updateLoadStopDeliveryStatusBodyDto.status} for Stop ${stopId} in Load ${id}`,
    );

    const stopIndex = load.stops.findIndex(
      (stopItem) => stopItem.stopId === stopId,
    );
    if (!~stopIndex) {
      throw new PreconditionFailedException(`No Stop ${stopId} in Load ${id}`);
    }
    const stop = load.stops[stopIndex];
    if (stop.type !== StopType.Delivery) {
      throw new PreconditionFailedException(
        `Stop ${stopId} in Load ${id} has wrong type: ${stop.type}`,
      );
    }

    const oldStopStatus = stop.status;
    const newStopStatus = updateLoadStopDeliveryStatusBodyDto.status;
    const oldStopStatusIndex = STOP_DELIVERY_STATUSES.findIndex(
      (status) => status === oldStopStatus,
    );
    const newStopStatusIndex = STOP_DELIVERY_STATUSES.findIndex(
      (status) => status === newStopStatus,
    );
    if (Math.abs(oldStopStatusIndex - newStopStatusIndex) !== 1) {
      throw new PreconditionFailedException(
        `Stop status can be changed only sequentially. Got ${oldStopStatus} -> ${newStopStatus}`,
      );
    }

    stop.set('status', updateLoadStopDeliveryStatusBodyDto.status);

    /*if (
      newStopStatusIndex === STOP_DELIVERY_STATUSES.length - 1 &&
      stopIndex !== load.stops.length - 1
    ) {
      const nextStop = load.stops[stopIndex + 1];
      switch (nextStop.type) {
        case StopType.PickUp:
          nextStop.set('status', STOP_PICKUP_STATUSES[1]);
          break;
        case StopType.Delivery:
          nextStop.set('status', STOP_DELIVERY_STATUSES[1]);
          break;
      }
    } else if (
      newStopStatusIndex === STOP_DELIVERY_STATUSES.length - 1 &&
      stopIndex === load.stops.length - 1
    ) {
      load.set('status', 'Completed');
    }*/

    await load.save();

    return LoadResultDto.fromLoadModel(load);
  }

  async setStopPickUpDriversInfo(
    id: Types.ObjectId,
    stopId: Types.ObjectId,
    setStopPickUpDriversInfoDto: CreateStopPickUpDriversInfoDto[],
  ): Promise<LoadResultDto> {
    const load = await this.findLoadDocumentById(id);

    this.log.debug(
      `Setting new drivers info for Stop ${stopId} in Load ${id}: ${JSON.stringify(setStopPickUpDriversInfoDto)}`,
    );

    const stopIndex = load.stops.findIndex(
      (stopItem) => stopItem.stopId === stopId,
    );
    if (!~stopIndex) {
      throw new PreconditionFailedException(`No Stop ${stopId} in Load ${id}`);
    }
    const stop = load.stops[stopIndex];
    if (stop.type !== StopType.PickUp) {
      throw new PreconditionFailedException(
        `Stop ${stopId} in Load ${id} has wrong type: ${stop.type}`,
      );
    }

    stop.set('driversInfo', setStopPickUpDriversInfoDto);

    await load.save();

    return LoadResultDto.fromLoadModel(load);
  }

  async setStopDeliveryDriversInfo(
    id: Types.ObjectId,
    stopId: Types.ObjectId,
    setStopDeliveryDriversInfoDto: CreateStopDeliveryDriversInfoDto[],
  ): Promise<LoadResultDto> {
    const load = await this.findLoadDocumentById(id);

    this.log.debug(
      `Setting new drivers info for Stop ${stopId} in Load ${id}: ${JSON.stringify(setStopDeliveryDriversInfoDto)}`,
    );

    const stopIndex = load.stops.findIndex(
      (stopItem) => stopItem.stopId === stopId,
    );
    if (!~stopIndex) {
      throw new PreconditionFailedException(`No Stop ${stopId} in Load ${id}`);
    }
    const stop = load.stops[stopIndex];
    if (stop.type !== StopType.Delivery) {
      throw new PreconditionFailedException(
        `Stop ${stopId} in Load ${id} has wrong type: ${stop.type}`,
      );
    }

    stop.set('driversInfo', setStopDeliveryDriversInfoDto);

    await load.save();

    return LoadResultDto.fromLoadModel(load);
  }

  async deleteLoad(id: Types.ObjectId): Promise<LoadResultDto> {
    const load = await this.findLoadDocumentById(id);

    this.log.debug(`Deleting Load ${load._id}`);

    await load.deleteOne();
    this.log.debug('Load deleted');

    return LoadResultDto.fromLoadModel(load);
  }
}
