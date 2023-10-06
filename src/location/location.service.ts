import { mongo, PaginateModel, PaginateOptions } from 'mongoose';
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
  UNIQUE_CONSTRAIN_ERROR,
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

  private async findLocationDocumentById(
    id: string,
  ): Promise<LocationDocument> {
    this.log.debug(`Searching for Location ${id}`);
    const location = await this.locationModel.findOne({ _id: id });
    if (!location) {
      throw new NotFoundException(`Location ${id} was not found`);
    }
    this.log.debug(`Location ${location._id}`);

    return location;
  }

  async findLocationById(id: string): Promise<LocationResultDto> {
    const location = await this.findLocationDocumentById(id);
    return LocationResultDto.fromLocationModel(location);
  }

  async findNearestLocation(
    location: [number, number],
  ): Promise<LocationResultDto> {
    this.log.debug(
      `Searching for Location, nearest to [${location.join(',')}]`,
    );
    const locationRes = await this.locationModel.findOne({
      location: { $nearSphere: [location[1], location[0]] },
    });
    if (!locationRes) {
      throw new NotFoundException(
        `Location, nearest to [${location.join(',')}], was not found`,
      );
    }
    this.log.debug(`Location ${locationRes._id}`);
    return LocationResultDto.fromLocationModel(locationRes);
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
        $nearSphere: [query.search.location[1], query.search.location[0]],
        $maxDistance: query.search.distance / EARTH_RADIUS_MILES,
      };
    }
    if (query?.search?.search) {
      let search = query?.search?.search;
      const stateCodeMatches = search?.match(/(\b[A-Z]{2}\b)/);
      if (stateCodeMatches && stateCodeMatches[1]) {
        const stateCode = stateCodeMatches[1];
        documentQuery.stateCode = { $eq: stateCode };
        search = search?.replace(stateCode, '').trim();
      }
      const zipCodeMatches = search?.match(/(\b[0-9]{1,5}\b)/);
      if (zipCodeMatches && zipCodeMatches[1]) {
        const zipCode = zipCodeMatches[1];
        documentQuery.zipCode = { $regex: new RegExp('^' + zipCode, 'i') };
        search = search?.replace(zipCode, '').trim();
      }
      if (search) {
        documentQuery.$or = [{ name: { $regex: new RegExp(search, 'i') } }];
      }
    }
    if (query?.search?.searchState) {
      const searchState = query?.search?.searchState;
      documentQuery.$or = [
        ...(documentQuery.$or ? documentQuery.$or : []),
        { stateCode: { $regex: new RegExp(searchState, 'i') } },
        { stateName: { $regex: new RegExp(searchState, 'i') } },
      ];
    }

    const options: PaginateOptions = {
      limit: query.limit,
      offset: query.offset,
      forceCountFn: true,
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
        throw new ConflictException({ type: UNIQUE_CONSTRAIN_ERROR, e });
      }
      throw new InternalServerErrorException(e.message);
    }
  }

  async updateLocation(
    id: string,
    updateLocationDto: UpdateLocationDto,
  ): Promise<LocationResultDto> {
    const location = await this.findLocationDocumentById(id);
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
      if (e instanceof MongoError && e.code === MONGO_UNIQUE_INDEX_CONFLICT) {
        throw new ConflictException({ type: UNIQUE_CONSTRAIN_ERROR, e });
      }
      throw new InternalServerErrorException(e.message);
    }
  }

  async deleteLocation(id: string): Promise<LocationResultDto> {
    const location = await this.findLocationDocumentById(id);

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
