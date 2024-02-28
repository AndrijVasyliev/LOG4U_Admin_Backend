import { mongo, PaginateModel, PaginateOptions } from 'mongoose';
import {
  ConflictException,
  Injectable,
  PreconditionFailedException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { LoggerService } from '../logger';
import {
  EARTH_RADIUS_MILES,
  MONGO_CONNECTION_NAME,
  MONGO_UNIQUE_INDEX_CONFLICT,
  UNIQUE_CONSTRAIN_ERROR,
} from '../utils/constants';
import { calcDistance } from '../utils/haversine.distance';
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
import { GoogleGeoApiService } from '../googleGeoApi/googleGeoApi.service';
import { LocationService } from '../location/location.service';
import { escapeForRegExp } from '../utils/escapeForRegExp';
import { UserResultDto } from '../user/user.dto';
import { ConfigService } from '@nestjs/config';

const { MongoError } = mongo;

@Injectable()
export class TruckService {
  private readonly nearByRedundancyFactor: number;
  constructor(
    @InjectModel(Truck.name, MONGO_CONNECTION_NAME)
    private readonly truckModel: PaginateModel<TruckDocument>,
    private readonly locationService: LocationService,
    private readonly geoApiService: GoogleGeoApiService,
    private readonly log: LoggerService,
    private readonly configService: ConfigService,
  ) {
    this.nearByRedundancyFactor =
      this.configService.get<number>('trucks.nearByRedundancyFactor') || 0;
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
    if (query?.search?.status) {
      documentQuery.$or = query.search.status.map((item) => ({
        status: item,
      }));
    }
    if (query?.search?.lastLocation && query?.search?.distance) {
      documentQuery.lastLocation = {
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
      const search = escapeForRegExp(query?.search?.search);
      documentQuery.$or = [
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-expect-error
        ...documentQuery.$or,
        { vinCode: { $regex: new RegExp(search, 'i') } },
        { licencePlate: { $regex: new RegExp(search, 'i') } },
      ];
      if (Number.isFinite(+search) && !Number.isNaN(+search)) {
        documentQuery.$or.push({
          $expr: {
            $regexMatch: {
              input: { $toString: '$truckNumber' },
              regex: new RegExp(search, 'i'),
            },
          },
        });
      }
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
          truck.lastLocation &&
          query?.search?.lastLocation &&
          calcDistance(truck.lastLocation, query.search.lastLocation),
      );
      this.log.debug('Calculating distance by roads');
      roadsDistances = await Promise.all(
        res.docs.map(
          (truck) =>
            truck.lastLocation &&
            query?.search?.lastLocation &&
            this.geoApiService.getDistance(
              truck.lastLocation,
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

    if (
      createTruckDto?.status === 'Will be available' &&
      !(createTruckDto?.availabilityLocation && createTruckDto?.availabilityAt)
    ) {
      throw new PreconditionFailedException(
        'Status must be "Will bw available" and fields "availabilityLocation" and "availabilityAt" must be present',
      );
    }

    let lastCity = '';
    if (createTruckDto.lastLocation) {
      try {
        const nearestCity = await this.locationService.findNearestLocation(
          createTruckDto.lastLocation,
        );
        lastCity = nearestCity.id;
      } catch {}
    }
    let availabilityCity = '';
    if (createTruckDto.availabilityLocation) {
      try {
        const nearestCity = await this.locationService.findNearestLocation(
          createTruckDto.availabilityLocation,
        );
        availabilityCity = nearestCity.id;
      } catch {}
    }

    const createdTruck = new this.truckModel(createTruckDto);

    if (lastCity) {
      Object.assign(createdTruck, { lastCity, locationUpdatedAt: new Date() });
    }
    if (availabilityCity) {
      Object.assign(createdTruck, { availabilityCity });
    }
    if (createTruckDto.reservedAt && user) {
      Object.assign(createdTruck, { reservedBy: user.id });
    }
    if (createTruckDto.reservedAt === null || !user) {
      Object.assign(createdTruck, { reservedAt: null, reservedBy: null });
    }

    try {
      this.log.debug('Saving Truck');
      const truck = await createdTruck.save();
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

  async updateTruck(
    id: string,
    updateTruckDto: UpdateTruckDto,
    user?: UserResultDto,
  ): Promise<TruckResultDto> {
    this.log.debug(`Setting new values: ${JSON.stringify(updateTruckDto)}`);

    if (
      updateTruckDto?.status === 'Will be available' &&
      !(updateTruckDto?.availabilityLocation && updateTruckDto?.availabilityAt)
    ) {
      throw new PreconditionFailedException(
        'Status must be "Will bw available" and fields "availabilityLocation" and "availabilityAt" must be present',
      );
    }

    const truck = await this.findTruckDocumentById(id);
    let lastCity = '';
    if (updateTruckDto.lastLocation) {
      try {
        const nearestCity = await this.locationService.findNearestLocation(
          updateTruckDto.lastLocation,
        );
        lastCity = nearestCity.id;
      } catch {}
    }
    let availabilityCity = '';
    if (updateTruckDto.availabilityLocation) {
      try {
        const nearestCity = await this.locationService.findNearestLocation(
          updateTruckDto.availabilityLocation,
        );
        availabilityCity = nearestCity.id;
      } catch {}
    }

    Object.assign(truck, updateTruckDto);

    if (lastCity) {
      Object.assign(truck, { lastCity, locationUpdatedAt: new Date() });
    }
    if (availabilityCity) {
      Object.assign(truck, { availabilityCity });
    }
    if (updateTruckDto.reservedAt && user) {
      Object.assign(truck, { reservedBy: user.id });
    }
    if (updateTruckDto.reservedAt === null || !user) {
      Object.assign(truck, { reservedAt: null, reservedBy: null });
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
