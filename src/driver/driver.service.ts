import { mongo, PaginateModel, PaginateOptions } from 'mongoose';
import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { LoggerService } from '../logger/logger.service';
import { MONGO_UNIQUE_INDEX_CONFLICT } from '../utils/constants';
import { Driver, DRIVER_TYPES, DriverDocument } from './driver.schema';
import {
  CreateDriverDto,
  DriverQuery,
  DriverResultDto,
  PaginatedDriverResultDto,
  UpdateDriverDto,
} from './driver.dto';
import { TruckService } from '../truck/truck.service';

const { MongoError } = mongo;

@Injectable()
export class DriverService {
  constructor(
    @InjectModel(Driver.name)
    private readonly driverModel: PaginateModel<DriverDocument>,
    private readonly truckService: TruckService,
    private readonly log: LoggerService,
  ) {}

  private async findDriverDocumentById(id: string): Promise<DriverDocument> {
    this.log.debug(`Searching for Driver ${id}`);
    const driver = await this.driverModel.findOne({
      _id: id,
      type: { $in: DRIVER_TYPES },
    });
    if (!driver) {
      throw new NotFoundException(`Driver ${id} was not found`);
    }
    this.log.debug(`Driver ${driver._id}`);

    return driver;
  }

  async findDriverById(id: string): Promise<DriverResultDto> {
    const driver = await this.findDriverDocumentById(id);
    return DriverResultDto.fromDriverModel(driver);
  }

  async getDrivers(query: DriverQuery): Promise<PaginatedDriverResultDto> {
    this.log.debug(`Searching for Drivers: ${JSON.stringify(query)}`);

    const documentQuery: Parameters<typeof this.driverModel.paginate>[0] = {};
    if (query.search) {
      const searchParams = Object.entries(query.search);
      searchParams.forEach((entry) => {
        documentQuery[entry[0]] = { $regex: new RegExp(entry[1], 'i') };
      });
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

    const options: PaginateOptions = {
      limit: query.limit,
      offset: query.offset,
    };
    if (query.direction && query.orderby) {
      options.sort = { [query.orderby]: query.direction };
    }
    options.populate = ['driveTrucks'];
    documentQuery.type = { $in: DRIVER_TYPES };
    const res = await this.driverModel.paginate(documentQuery, options);

    return PaginatedDriverResultDto.from(res);
  }

  async createDriver(
    createDriverDto: CreateDriverDto,
  ): Promise<DriverResultDto> {
    this.log.debug(`Creating new Driver: ${JSON.stringify(createDriverDto)}`);
    const createdDriver = new this.driverModel(createDriverDto);

    try {
      this.log.debug('Saving Driver');
      const driver = await createdDriver.save();
      return DriverResultDto.fromDriverModel(driver);
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

  async updateDriver(
    id: string,
    updateDriverDto: UpdateDriverDto,
  ): Promise<DriverResultDto> {
    const driver = await this.findDriverDocumentById(id);
    this.log.debug(`Setting new values: ${JSON.stringify(updateDriverDto)}`);
    Object.assign(driver, updateDriverDto);
    try {
      this.log.debug('Saving Driver');
      const savedDriver = await driver.save();
      this.log.debug(`Operator ${savedDriver._id} saved`);
      return DriverResultDto.fromDriverModel(driver);
    } catch (e) {
      if (!(e instanceof Error)) {
        throw new InternalServerErrorException(JSON.stringify(e));
      }
      throw new InternalServerErrorException(e.message);
    }
  }

  async deleteDriver(id: string): Promise<DriverResultDto> {
    const driver = await this.findDriverDocumentById(id);

    this.log.debug(`Deleting Driver ${driver._id}`);

    try {
      await driver.delete();
      this.log.debug('Driver deleted');
    } catch (e) {
      if (!(e instanceof Error)) {
        throw new InternalServerErrorException(JSON.stringify(e));
      }
      throw new InternalServerErrorException(e.message);
    }
    return DriverResultDto.fromDriverModel(driver);
  }
}
