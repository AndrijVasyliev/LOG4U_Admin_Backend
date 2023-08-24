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
import { OwnerDriver, OwnerDriverDocument } from './ownerDriver.schema';
import {
  CreateOwnerDriverDto,
  OwnerDriverQuery,
  OwnerDriverResultDto,
  PaginatedOwnerDriverResultDto,
  UpdateOwnerDriverDto,
} from './ownerDriver.dto';

const { MongoError } = mongo;

@Injectable()
export class OwnerDriverService {
  constructor(
    @InjectModel(OwnerDriver.name)
    private readonly ownerDriverModel: PaginateModel<OwnerDriverDocument>,
    private readonly log: LoggerService,
  ) {}

  private async findOwnerDriverById(id: string): Promise<OwnerDriverDocument> {
    this.log.debug(`Searching for OwnerDriver ${id}`);
    const ownerDriver = await this.ownerDriverModel.findOne({ _id: id });
    if (!ownerDriver) {
      throw new NotFoundException(`OwnerDriver ${id} was not found`);
    }
    this.log.debug(`OwnerDriver ${ownerDriver._id}`);

    return ownerDriver;
  }

  async findOwnerDriver(id: string): Promise<OwnerDriverResultDto> {
    const ownerDriver = await this.findOwnerDriverById(id);
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
        documentQuery[entry[0]] = { $regex: new RegExp(entry[1], 'i') };
      });
    }

    const options: PaginateOptions = {
      limit: query.limit,
      offset: query.offset,
    };
    if (query.direction && query.orderby) {
      options.sort = { [query.orderby]: query.direction };
    }

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

    try {
      this.log.debug('Saving OwnerDriver');
      const ownerDriver = await createdOwnerDriver.save();
      return OwnerDriverResultDto.fromOwnerDriverModel(ownerDriver);
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

  async updateOwnerDriver(
    id: string,
    updateOwnerDriverDto: UpdateOwnerDriverDto,
  ): Promise<OwnerDriverResultDto> {
    const ownerDriver = await this.findOwnerDriverById(id);
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
      throw new InternalServerErrorException(e.message);
    }
  }

  async deleteOwnerDriver(id: string): Promise<OwnerDriverResultDto> {
    const ownerDriver = await this.findOwnerDriverById(id);

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
