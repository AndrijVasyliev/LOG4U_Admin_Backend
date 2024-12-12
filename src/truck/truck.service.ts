import { ObjectId, PaginateModel, PaginateOptions, Types } from 'mongoose';
import {
  Injectable,
  PreconditionFailedException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ConfigService } from '@nestjs/config';
import { Truck, TruckDocument } from './truck.schema';
import {
  CreateTruckDto,
  TruckQuery,
  TruckResultDto,
  PaginatedTruckResultDto,
  TruckResultForMapDto,
  UpdateTruckDto,
  CalculatedDistances,
} from './truck.dto';
import { LoggerService } from '../logger';
import { GoogleGeoApiService } from '../googleGeoApi/googleGeoApi.service';
import { EARTH_RADIUS_MILES, MONGO_CONNECTION_NAME } from '../utils/constants';
import { escapeForRegExp } from '../utils/escapeForRegExp';
import { calcDistance } from '../utils/haversine.distance';

@Injectable()
export class TruckService {
  private readonly nearByRedundancyFactor: number;
  constructor(
    @InjectModel(Truck.name, MONGO_CONNECTION_NAME)
    private readonly truckModel: PaginateModel<TruckDocument>,
    private readonly geoApiService: GoogleGeoApiService,
    private readonly configService: ConfigService,
    private readonly log: LoggerService,
  ) {
    this.nearByRedundancyFactor =
      this.configService.get<number>('trucks.nearByRedundancyFactor') || 0;
  }

  private async findTruckDocumentById(
    id: Types.ObjectId,
  ): Promise<TruckDocument> {
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

  async findTruckById(
    id: Types.ObjectId,
  ): Promise<TruckResultDto> {
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
        entry[0] !== 'search' &&
          entry[0] !== 'availableBefore' &&
          entry[0] !== 'availableAfter' &&
          entry[0] !== 'status' &&
          entry[0] !== 'lastLocation' &&
          entry[0] !== 'distance' &&
          entry[0] !== 'truckNumber' &&
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

  async createTruck(createTruckDto: CreateTruckDto): Promise<TruckResultDto> {
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

    this.log.debug('Saving Truck');
    const createdTruck = await truck.save();

    return TruckResultDto.fromTruckModel(createdTruck);
  }

  async updateTruck(
    id: Types.ObjectId,
    updateTruckDto: UpdateTruckDto,
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
      newTruckStatus !== 'Will be available'
    ) {
      Object.assign(truck, {
        searchLocation: updateTruckDto.lastLocation,
      });
    }
    Object.assign(truck, updateTruckDto);
    if (updateTruckDto.lastLocation) {
      Object.assign(truck, { locationUpdatedAt: new Date() });
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
      updateTruckDto.availabilityLocation &&
      currentTruckStatus === 'Will be available' &&
      (!newTruckStatus || newTruckStatus === currentTruckStatus)
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

    this.log.debug('Saving Truck');
    const savedTruck = await truck.save();
    this.log.debug(`Truck ${savedTruck._id} saved`);

    return TruckResultDto.fromTruckModel(truck);
  }

  async deleteTruck(id: Types.ObjectId): Promise<TruckResultDto> {
    const truck = await this.findTruckDocumentById(id);

    this.log.debug(`Deleting Truck ${truck._id}`);

    await truck.deleteOne();
    this.log.debug('Truck deleted');

    return TruckResultDto.fromTruckModel(truck);
  }
}
