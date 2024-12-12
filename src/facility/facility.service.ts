import { PaginateModel, PaginateOptions, Types } from 'mongoose';
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { LoggerService } from '../logger';
import { EARTH_RADIUS_MILES, MONGO_CONNECTION_NAME } from '../utils/constants';
import { Facility, FacilityDocument } from './facility.schema';
import {
  CreateFacilityDto,
  FacilityQuery,
  FacilityResultDto,
  PaginatedFacilityResultDto,
  UpdateFacilityDto,
} from './facility.dto';
import { escapeForRegExp } from '../utils/escapeForRegExp';

@Injectable()
export class FacilityService {
  constructor(
    @InjectModel(Facility.name, MONGO_CONNECTION_NAME)
    private readonly facilityModel: PaginateModel<FacilityDocument>,
    private readonly log: LoggerService,
  ) {}

  private async findFacilityDocumentById(
    id: Types.ObjectId,
  ): Promise<FacilityDocument> {
    this.log.debug(`Searching for Facility ${id}`);
    const facility = await this.facilityModel.findOne({ _id: id });
    if (!facility) {
      throw new NotFoundException(`Facility ${id} was not found`);
    }
    this.log.debug(`Facility ${facility._id}`);

    return facility;
  }

  async findFacilityById(id: Types.ObjectId): Promise<FacilityResultDto> {
    const facility = await this.findFacilityDocumentById(id);
    return FacilityResultDto.fromFacilityModel(facility);
  }

  async getFacilities(
    query: FacilityQuery,
  ): Promise<PaginatedFacilityResultDto> {
    this.log.debug(`Searching for Facilities: ${JSON.stringify(query)}`);

    const documentQuery: Parameters<typeof this.facilityModel.paginate>[0] = {};
    if (query.search) {
      const searchParams = Object.entries(query.search);
      searchParams.forEach((entry) => {
        entry[0] !== 'search' &&
          entry[0] !== 'facilityLocation' &&
          entry[0] !== 'distance' &&
          (documentQuery[entry[0]] = {
            $regex: new RegExp(escapeForRegExp(entry[1]), 'i'),
          });
      });
    }
    if (query?.search?.search) {
      const search = escapeForRegExp(query?.search?.search);
      documentQuery.$or = [{ name: { $regex: new RegExp(search, 'i') } }];
    }
    if (query?.search?.facilityLocation && query?.search?.distance) {
      documentQuery.facilityLocation = {
        $nearSphere: [
          query.search.facilityLocation[1],
          query.search.facilityLocation[0],
        ],
        $maxDistance: query.search.distance / EARTH_RADIUS_MILES,
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

    const res = await this.facilityModel.paginate(documentQuery, options);

    return PaginatedFacilityResultDto.from(res);
  }

  async createFacility(
    createFacilityDto: CreateFacilityDto,
  ): Promise<FacilityResultDto> {
    this.log.debug(
      `Creating new Facility: ${JSON.stringify(createFacilityDto)}`,
    );

    const createdFacility = new this.facilityModel(createFacilityDto);

    this.log.debug('Saving Facility');
    const facility = await createdFacility.save();

    return FacilityResultDto.fromFacilityModel(facility);
  }

  async updateFacility(
    id: Types.ObjectId,
    updateFacilityDto: UpdateFacilityDto,
  ): Promise<FacilityResultDto> {
    const facility = await this.findFacilityDocumentById(id);
    this.log.debug(`Setting new values: ${JSON.stringify(updateFacilityDto)}`);
    Object.assign(facility, updateFacilityDto);
    this.log.debug('Saving Facility');
    const savedFacility = await facility.save();
    this.log.debug(`Facility ${savedFacility._id} saved`);

    return FacilityResultDto.fromFacilityModel(facility);
  }

  async deleteFacility(id: Types.ObjectId): Promise<FacilityResultDto> {
    const facility = await this.findFacilityDocumentById(id);

    this.log.debug(`Deleting Facility ${facility._id}`);

    await facility.deleteOne();
    this.log.debug('Facility deleted');

    return FacilityResultDto.fromFacilityModel(facility);
  }
}
