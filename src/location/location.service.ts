import { mongo, PaginateModel } from 'mongoose';
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
import { Location, LocationDocument } from './location.schema';
import {
  CreateLocationDto,
  LocationQuery,
  LocationResultDto,
  PaginatedLocationResultDto,
  UpdateLocationDto,
} from './location.dto';

const { MongoError } = mongo;

@Injectable()
export class LocationService {
  constructor(
    @InjectModel(Location.name)
    private readonly locationModel: PaginateModel<LocationDocument>,
    private readonly log: LoggerService,
  ) {}

  private async findLocationById(id: string): Promise<LocationDocument> {
    this.log.debug(`Searching for Location ${id}`);
    const location = await this.locationModel.findOne({ _id: id });
    if (!location) {
      throw new NotFoundException(`Location ${id} was not found`);
    }
    this.log.debug(`Location ${location._id}`);

    return location;
  }

  async findLocation(id: string): Promise<LocationResultDto> {
    const location = await this.findLocationById(id);
    return LocationResultDto.fromLocationModel(location);
  }

  async getLocations(
    query: LocationQuery,
  ): Promise<PaginatedLocationResultDto> {
    this.log.debug(`Searching for Locations: ${JSON.stringify(query)}`);

    const documentQuery: Parameters<typeof this.locationModel.paginate>[0] = {};
    if (query.search) {
      const searchParams = Object.entries(query.search);
      searchParams.forEach((entry) => {
        entry[0] !== 'location' &&
          entry[0] !== 'distance' &&
          entry[0] !== 'search' &&
          (documentQuery[entry[0]] = { $regex: new RegExp(entry[1], 'i') });
      });
    }
    if (query?.search?.location && query?.search?.distance) {
      documentQuery.location = {
        $geoWithin: {
          $centerSphere: [
            [query.search.location[1], query.search.location[0]],
            query.search.distance / EARTH_RADIUS_MILES,
          ],
        },
      };
    }
    if (query?.search?.search) {
      let search = query?.search?.search;
      const matches = search?.match(/([A-Z]{2})/);
      if (matches && matches[1]) {
        const stateCode = matches[1];
        documentQuery.stateCode = { $eq: stateCode };
        search = search?.replace(stateCode, '').trim();
      }
      if (search) {
        documentQuery.$or = [
          { zipCode: { $regex: new RegExp(search, 'i') } },
          { name: { $regex: new RegExp(search, 'i') } },
        ];
      }
    }
    if (query?.search?.searchState) {
      const searchState = query?.search?.searchState;
      documentQuery.$or = [
        { stateCode: { $regex: new RegExp(searchState, 'i') } },
        { stateName: { $regex: new RegExp(searchState, 'i') } },
      ];
    }

    const options: {
      limit: number;
      offset: number;
      sort?: Record<string, string>;
    } = {
      limit: query.limit,
      offset: query.offset,
    };
    if (query.direction && query.orderby) {
      options.sort = { [query.orderby]: query.direction };
    }

    const res = await this.locationModel.paginate(documentQuery, options);

    return PaginatedLocationResultDto.from(res);
  }

  async createLocation(
    createLocationDto: CreateLocationDto,
  ): Promise<LocationResultDto> {
    this.log.debug(
      `Creating new Location: ${JSON.stringify(createLocationDto)}`,
    );
    const createdLocation = new this.locationModel(createLocationDto);

    try {
      this.log.debug('Saving Location');
      const location = await createdLocation.save();
      return LocationResultDto.fromLocationModel(location);
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

  async updateLocation(
    id: string,
    updateLocationDto: UpdateLocationDto,
  ): Promise<LocationResultDto> {
    const location = await this.findLocationById(id);
    this.log.debug(`Setting new values: ${JSON.stringify(updateLocationDto)}`);
    Object.assign(location, updateLocationDto);
    try {
      this.log.debug('Saving Location');
      const savedLocation = await location.save();
      this.log.debug(`Operator ${savedLocation._id} saved`);
      return LocationResultDto.fromLocationModel(location);
    } catch (e) {
      if (!(e instanceof Error)) {
        throw new InternalServerErrorException(JSON.stringify(e));
      }
      throw new InternalServerErrorException(e.message);
    }
  }

  async deleteLocation(id: string): Promise<LocationResultDto> {
    const location = await this.findLocationById(id);

    this.log.debug(`Deleting Location ${location._id}`);

    try {
      await location.delete();
      this.log.debug('Location deleted');
    } catch (e) {
      if (!(e instanceof Error)) {
        throw new InternalServerErrorException(JSON.stringify(e));
      }
      throw new InternalServerErrorException(e.message);
    }
    return LocationResultDto.fromLocationModel(location);
  }
}
