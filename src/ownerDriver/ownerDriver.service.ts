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
  MONGO_UNIQUE_INDEX_CONFLICT,
  UNIQUE_CONSTRAIN_ERROR,
} from '../utils/constants';
import { OwnerDriver, OwnerDriverDocument } from './ownerDriver.schema';
import {
  CreateOwnerDriverDto,
  OwnerDriverQuery,
  OwnerDriverResultDto,
  PaginatedOwnerDriverResultDto,
  UpdateOwnerDriverDto,
} from './ownerDriver.dto';
import { TruckService } from '../truck/truck.service';

const { MongoError } = mongo;

@Injectable()
export class OwnerDriverService {
  constructor(
    @InjectModel(OwnerDriver.name)
    private readonly ownerDriverModel: PaginateModel<OwnerDriverDocument>,
    private readonly truckService: TruckService,
    private readonly log: LoggerService,
  ) {}

  private async findOwnerDriverDocumentById(
    id: string,
  ): Promise<OwnerDriverDocument> {
    this.log.debug(`Searching for OwnerDriver ${id}`);
    const ownerDriver = await this.ownerDriverModel
      .findOne({
        _id: id,
        type: 'OwnerDriver',
      })
      .populate('ownTrucks')
      .populate('coordinators')
      .populate('drivers')
      .populate('driveTrucks');
    if (!ownerDriver) {
      throw new NotFoundException(`OwnerDriver ${id} was not found`);
    }
    this.log.debug(`OwnerDriver ${ownerDriver._id}`);

    return ownerDriver;
  }

  async findOwnerDriverById(id: string): Promise<OwnerDriverResultDto> {
    const ownerDriver = await this.findOwnerDriverDocumentById(id);
    return OwnerDriverResultDto.fromOwnerDriverModel(ownerDriver);
  }

  async getOwnerDrivers(
    query: OwnerDriverQuery,
  ): Promise<PaginatedOwnerDriverResultDto> {
    this.log.debug(`Searching for OwnerDrivers: ${JSON.stringify(query)}`);

    const documentQuery: Parameters<typeof this.ownerDriverModel.paginate>[0] =
      {};
    if (query.search) {
      const searchParams = Object.entries(query.search);
      searchParams.forEach((entry) => {
        entry[0] !== 'owner' &&
          entry[0] !== 'truckNumber' &&
          (documentQuery[entry[0]] = { $regex: new RegExp(entry[1], 'i') });
      });
    }
    if (query?.search?.owner) {
      documentQuery.owner = {
        $eq: query.search.owner,
      };
    }
    if (query?.search?.truckNumber) {
      const truck = await this.truckService.findTruckByNumber(
        query.search.truckNumber,
      );
      const { owner, coordinator, driver } = truck;
      const conditions = [];
      if (owner) {
        conditions.push({ _id: owner.id });
      }
      if (coordinator) {
        conditions.push({ _id: coordinator.id });
      }
      if (driver) {
        conditions.push({ _id: driver.id });
      }
      if (conditions.length === 1) {
        Object.assign(documentQuery, conditions[0]);
      }
      if (conditions.length > 1) {
        documentQuery.$or = conditions;
      }
    }
    if (query?.search?.search) {
      const search = query?.search?.search;
      documentQuery.$or = [
        ...(documentQuery.$or ? documentQuery.$or : []),
        { fullName: { $regex: new RegExp(search, 'i') } },
        { phone: { $regex: new RegExp(search, 'i') } },
        { phone2: { $regex: new RegExp(search, 'i') } },
        { email: { $regex: new RegExp(search, 'i') } },
      ];
    }

    const options: PaginateOptions = {
      limit: query.limit,
      offset: query.offset,
    };
    if (query.direction && query.orderby) {
      options.sort = { [query.orderby]: query.direction };
    }
    options.populate = ['ownTrucks', 'coordinators', 'drivers', 'driveTrucks'];
    documentQuery.type = 'OwnerDriver';
    const res = await this.ownerDriverModel.paginate(documentQuery, options);

    return PaginatedOwnerDriverResultDto.from(res);
  }

  async createOwnerDriver(
    createOwnerDriverDto: CreateOwnerDriverDto,
  ): Promise<OwnerDriverResultDto> {
    this.log.debug(
      `Creating new OwnerDriver: ${JSON.stringify(createOwnerDriverDto)}`,
    );
    const createdOwnerDriver = new this.ownerDriverModel(createOwnerDriverDto);
    createdOwnerDriver.owner = createdOwnerDriver._id;

    try {
      this.log.debug('Saving OwnerDriver');
      const ownerDriver = await createdOwnerDriver.save();
      return OwnerDriverResultDto.fromOwnerDriverModel(ownerDriver);
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

  async updateOwnerDriver(
    id: string,
    updateOwnerDriverDto: UpdateOwnerDriverDto,
  ): Promise<OwnerDriverResultDto> {
    const ownerDriver = await this.findOwnerDriverDocumentById(id);
    this.log.debug(
      `Setting new values: ${JSON.stringify(updateOwnerDriverDto)}`,
    );
    Object.assign(ownerDriver, updateOwnerDriverDto);
    try {
      this.log.debug('Saving OwnerDriver');
      const savedOwnerDriver = await ownerDriver.save();
      this.log.debug(`Operator ${savedOwnerDriver._id} saved`);
      return OwnerDriverResultDto.fromOwnerDriverModel(ownerDriver);
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

  async deleteOwnerDriver(id: string): Promise<OwnerDriverResultDto> {
    const ownerDriver = await this.findOwnerDriverDocumentById(id);

    this.log.debug(`Deleting OwnerDriver ${ownerDriver._id}`);

    try {
      await ownerDriver.delete();
      this.log.debug('OwnerDriver deleted');
    } catch (e) {
      if (!(e instanceof Error)) {
        throw new InternalServerErrorException(JSON.stringify(e));
      }
      throw new InternalServerErrorException(e.message);
    }
    return OwnerDriverResultDto.fromOwnerDriverModel(ownerDriver);
  }
}
