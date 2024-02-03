import { mongo, PaginateModel, PaginateOptions } from 'mongoose';
import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { LoggerService } from '../logger';
import {
  MONGO_CONNECTION_NAME,
  MONGO_UNIQUE_INDEX_CONFLICT,
  OWNER_TYPES,
  UNIQUE_CONSTRAIN_ERROR,
} from '../utils/constants';
import {
  CoordinatorDriver,
  CoordinatorDriverDocument,
} from './coordinatorDriver.schema';
import {
  CreateCoordinatorDriverDto,
  CoordinatorDriverQuery,
  CoordinatorDriverResultDto,
  PaginatedCoordinatorDriverResultDto,
  UpdateCoordinatorDriverDto,
} from './coordinatorDriver.dto';
import { TruckService } from '../truck/truck.service';
import { escapeForRegExp } from '../utils/escapeForRegExp';

const { MongoError } = mongo;

@Injectable()
export class CoordinatorDriverService {
  constructor(
    @InjectModel(CoordinatorDriver.name, MONGO_CONNECTION_NAME)
    private readonly coordinatorDriverModel: PaginateModel<CoordinatorDriverDocument>,
    private readonly truckService: TruckService,
    private readonly log: LoggerService,
  ) {}

  private async findCoordinatorDriverDocumentById(
    id: string,
  ): Promise<CoordinatorDriverDocument> {
    this.log.debug(`Searching for CoordinatorDriver ${id}`);
    const coordinatorDriver = await this.coordinatorDriverModel
      .findOne({
        _id: id,
        type: 'CoordinatorDriver',
      })
      .populate('coordinateTrucks')
      .populate('driveTrucks');
    if (!coordinatorDriver) {
      throw new NotFoundException(`CoordinatorDriver ${id} was not found`);
    }
    this.log.debug(`CoordinatorDriver ${coordinatorDriver._id}`);

    return coordinatorDriver.populate('coordinateTrucks');
  }

  async findCoordinatorDriverById(
    id: string,
  ): Promise<CoordinatorDriverResultDto> {
    const coordinatorDriver = await this.findCoordinatorDriverDocumentById(id);
    return CoordinatorDriverResultDto.fromCoordinatorDriverModel(
      coordinatorDriver,
    );
  }

  async getCoordinatorDrivers(
    query: CoordinatorDriverQuery,
  ): Promise<PaginatedCoordinatorDriverResultDto> {
    this.log.debug(
      `Searching for CoordinatorDrivers: ${JSON.stringify(query)}`,
    );

    const documentQuery: Parameters<
      typeof this.coordinatorDriverModel.paginate
    >[0] = {};
    if (query.search) {
      const searchParams = Object.entries(query.search);
      searchParams.forEach((entry) => {
        entry[0] !== 'owner' &&
          entry[0] !== 'truckNumber' &&
          entry[0] !== 'search' &&
          (documentQuery[entry[0]] = {
            $regex: new RegExp(escapeForRegExp(entry[1]), 'i'),
          });
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
      const search = escapeForRegExp(query?.search?.search);
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
    options.populate = ['coordinateTrucks', 'driveTrucks'];
    documentQuery.type = 'CoordinatorDriver';
    const res = await this.coordinatorDriverModel.paginate(
      documentQuery,
      options,
    );

    return PaginatedCoordinatorDriverResultDto.from(res);
  }

  async createCoordinatorDriver(
    createCoordinatorDriverDto: CreateCoordinatorDriverDto,
  ): Promise<CoordinatorDriverResultDto> {
    this.log.debug(
      `Creating new CoordinatorDriver: ${JSON.stringify(
        createCoordinatorDriverDto,
      )}`,
    );
    const createdCoordinatorDriver = new this.coordinatorDriverModel(
      createCoordinatorDriverDto,
    );

    try {
      this.log.debug('Saving CoordinatorDriver');
      const coordinatorDriver = await createdCoordinatorDriver.save();
      await coordinatorDriver.populate({
        path: 'owner',
        match: { type: { $in: OWNER_TYPES } },
      });
      return CoordinatorDriverResultDto.fromCoordinatorDriverModel(
        coordinatorDriver,
      );
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

  async updateCoordinatorDriver(
    id: string,
    updateCoordinatorDriverDto: UpdateCoordinatorDriverDto,
  ): Promise<CoordinatorDriverResultDto> {
    const coordinatorDriver = await this.findCoordinatorDriverDocumentById(id);
    this.log.debug(
      `Setting new values: ${JSON.stringify(updateCoordinatorDriverDto)}`,
    );
    Object.assign(coordinatorDriver, updateCoordinatorDriverDto);
    try {
      this.log.debug('Saving CoordinatorDriver');
      const savedCoordinatorDriver = await coordinatorDriver.save();
      this.log.debug(`CoordinatorDriver ${savedCoordinatorDriver._id} saved`);
      await coordinatorDriver.populate({
        path: 'owner',
        match: { type: { $in: OWNER_TYPES } },
      });
      return CoordinatorDriverResultDto.fromCoordinatorDriverModel(
        coordinatorDriver,
      );
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

  async deleteCoordinatorDriver(
    id: string,
  ): Promise<CoordinatorDriverResultDto> {
    const coordinatorDriver = await this.findCoordinatorDriverDocumentById(id);

    this.log.debug(`Deleting CoordinatorDriver ${coordinatorDriver._id}`);

    try {
      await coordinatorDriver.deleteOne();
      this.log.debug('CoordinatorDriver deleted');
    } catch (e) {
      if (!(e instanceof Error)) {
        throw new InternalServerErrorException(JSON.stringify(e));
      }
      throw new InternalServerErrorException(e.message);
    }
    return CoordinatorDriverResultDto.fromCoordinatorDriverModel(
      coordinatorDriver,
    );
  }
}
