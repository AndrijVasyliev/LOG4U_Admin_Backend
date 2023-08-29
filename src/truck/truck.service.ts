import { mongo, ObjectId, PaginateModel, PaginateOptions } from 'mongoose';
import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { LoggerService } from '../logger/logger.service';
import {
  EARTH_RADIUS_MILES,
  MONGO_UNIQUE_INDEX_CONFLICT,
} from '../utils/constants';
import { calcDistance } from '../utils/haversine.distance';
import { Truck, TruckDocument } from './truck.schema';
import {
  CreateTruckDto,
  TruckQuery,
  TruckResultDto,
  PaginatedTruckResultDto,
  UpdateTruckDto,
  CalculatedDistances,
} from './truck.dto';
import { GoogleGeoApiService } from '../googleGeoApi/googleGeoApi.service';
import { LocationService } from '../location/location.service';

const { MongoError } = mongo;

@Injectable()
export class TruckService {
  constructor(
    @InjectModel(Truck.name)
    private readonly truckModel: PaginateModel<TruckDocument>,
    private readonly locationService: LocationService,
    private readonly geoApiService: GoogleGeoApiService,
    private readonly log: LoggerService,
  ) {}

  private async findTruckById(id: string): Promise<TruckDocument> {
    this.log.debug(`Searching for Truck ${id}`);
    const truck = await this.truckModel.findOne({ _id: id });
    if (!truck) {
      throw new NotFoundException(`Truck ${id} was not found`);
    }
    this.log.debug(`Truck ${truck._id}`);

    return truck;
  }

  async findTruck(id: string): Promise<TruckResultDto> {
    const truck = await this.findTruckById(id);
    return TruckResultDto.fromTruckModel(truck);
  }

  async getTrucks(query: TruckQuery): Promise<PaginatedTruckResultDto> {
    this.log.debug(`Searching for Trucks: ${JSON.stringify(query)}`);

    const documentQuery: Parameters<typeof this.truckModel.paginate>[0] = {};
    if (query.search) {
      const searchParams = Object.entries(query.search);
      searchParams.forEach((entry) => {
        entry[0] !== 'lastLocation' &&
          entry[0] !== 'distance' &&
          entry[0] !== 'truckNumber' &&
          (documentQuery[entry[0]] = { $regex: new RegExp(entry[1], 'i') });
      });
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

    const options: PaginateOptions = {
      limit: query.limit,
      offset: query.offset,
      forceCountFn: true,
    };
    if (query.direction && query.orderby) {
      options.sort = { [query.orderby]: query.direction };
    }

    const res = await this.truckModel.paginate(documentQuery, options);

    let haversineDistances: CalculatedDistances;
    let roadsDistances: CalculatedDistances;
    if (query?.search?.lastLocation) {
      haversineDistances = res.docs.map(
        (truck) =>
          truck.lastLocation &&
          query?.search?.lastLocation &&
          calcDistance(truck.lastLocation, query.search.lastLocation),
      );
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
    return PaginatedTruckResultDto.from(
      res,
      haversineDistances,
      roadsDistances,
    );
  }

  async createTruck(createTruckDto: CreateTruckDto): Promise<TruckResultDto> {
    this.log.debug(`Creating new Truck: ${JSON.stringify(createTruckDto)}`);
    let lastCity = '';
    if (createTruckDto.lastLocation) {
      try {
        const nearestCity = await this.locationService.findNearestLocation(
          createTruckDto.lastLocation,
        );
        lastCity = nearestCity.id;
      } catch {}
    }
    const createdTruck = new this.truckModel(
      lastCity
        ? { ...createTruckDto, lastCity, locationUpdatedAt: new Date() }
        : createTruckDto,
    );

    try {
      this.log.debug('Saving Truck');
      const truck = await createdTruck.save();
      return TruckResultDto.fromTruckModel(truck);
    } catch (e) {
      if (!(e instanceof Error)) {
        throw new InternalServerErrorException(JSON.stringify(e));
      }
      if (e instanceof MongoError && e.code === MONGO_UNIQUE_INDEX_CONFLICT) {
        throw new ConflictException(e.message);
      }
      throw new InternalServerErrorException(e.message);
    }
  }

  async updateTruck(
    id: string,
    updateTruckDto: UpdateTruckDto,
  ): Promise<TruckResultDto> {
    const truck = await this.findTruckById(id);
    let lastCity = '';
    if (updateTruckDto.lastLocation) {
      try {
        const nearestCity = await this.locationService.findNearestLocation(
          updateTruckDto.lastLocation,
        );
        lastCity = nearestCity.id;
      } catch {}
    }
    this.log.debug(`Setting new values: ${JSON.stringify(updateTruckDto)}`);
    Object.assign(
      truck,
      lastCity
        ? { ...updateTruckDto, lastCity, locationUpdatedAt: new Date() }
        : updateTruckDto,
    );
    try {
      this.log.debug('Saving Truck');
      const savedTruck = await truck.save();
      this.log.debug(`Operator ${savedTruck._id} saved`);
      return TruckResultDto.fromTruckModel(truck);
    } catch (e) {
      if (!(e instanceof Error)) {
        throw new InternalServerErrorException(JSON.stringify(e));
      }
      throw new InternalServerErrorException(e.message);
    }
  }

  async deleteTruck(id: string): Promise<TruckResultDto> {
    const truck = await this.findTruckById(id);

    this.log.debug(`Deleting Truck ${truck._id}`);

    try {
      await truck.delete();
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
