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
import { Coordinator, CoordinatorDocument } from './coordinator.schema';
import {
  CreateCoordinatorDto,
  CoordinatorQuery,
  CoordinatorResultDto,
  PaginatedCoordinatorResultDto,
  UpdateCoordinatorDto,
} from './coordinator.dto';
import { OWNER_TYPES } from '../owner/owner.schema';
import { TruckService } from '../truck/truck.service';

const { MongoError } = mongo;

@Injectable()
export class CoordinatorService {
  constructor(
    @InjectModel(Coordinator.name)
    private readonly coordinatorModel: PaginateModel<CoordinatorDocument>,
    private readonly truckService: TruckService,
    private readonly log: LoggerService,
  ) {}

  private async findCoordinatorDocumentById(
    id: string,
  ): Promise<CoordinatorDocument> {
    this.log.debug(`Searching for Coordinator ${id}`);
    const coordinator = await this.coordinatorModel.findOne({ _id: id });
    if (!coordinator) {
      throw new NotFoundException(`Coordinator ${id} was not found`);
    }
    this.log.debug(`Coordinator ${coordinator._id}`);

    return coordinator;
  }

  async findCoordinatorById(id: string): Promise<CoordinatorResultDto> {
    const coordinator = await this.findCoordinatorDocumentById(id);
    return CoordinatorResultDto.fromCoordinatorModel(coordinator);
  }

  async getCoordinators(
    query: CoordinatorQuery,
  ): Promise<PaginatedCoordinatorResultDto> {
    this.log.debug(`Searching for Coordinators: ${JSON.stringify(query)}`);

    const documentQuery: Parameters<typeof this.coordinatorModel.paginate>[0] =
      {};
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
    options.populate = ['coordinateTrucks'];
    const res = await this.coordinatorModel.paginate(documentQuery, options);

    return PaginatedCoordinatorResultDto.from(res);
  }

  async createCoordinator(
    createCoordinatorDto: CreateCoordinatorDto,
  ): Promise<CoordinatorResultDto> {
    this.log.debug(
      `Creating new Coordinator: ${JSON.stringify(createCoordinatorDto)}`,
    );
    const createdCoordinator = new this.coordinatorModel(createCoordinatorDto);

    try {
      this.log.debug('Saving Coordinator');
      const coordinator = await createdCoordinator.save();
      await coordinator.populate({
        path: 'owner',
        match: { type: { $in: OWNER_TYPES } },
      });
      return CoordinatorResultDto.fromCoordinatorModel(coordinator);
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

  async updateCoordinator(
    id: string,
    updateCoordinatorDto: UpdateCoordinatorDto,
  ): Promise<CoordinatorResultDto> {
    const coordinator = await this.findCoordinatorDocumentById(id);
    this.log.debug(
      `Setting new values: ${JSON.stringify(updateCoordinatorDto)}`,
    );
    Object.assign(coordinator, updateCoordinatorDto);
    try {
      this.log.debug('Saving Coordinator');
      const savedCoordinator = await coordinator.save();
      this.log.debug(`Operator ${savedCoordinator._id} saved`);
      await coordinator.populate({
        path: 'owner',
        match: { type: { $in: OWNER_TYPES } },
      });
      return CoordinatorResultDto.fromCoordinatorModel(coordinator);
    } catch (e) {
      if (!(e instanceof Error)) {
        throw new InternalServerErrorException(JSON.stringify(e));
      }
      throw new InternalServerErrorException(e.message);
    }
  }

  async deleteCoordinator(id: string): Promise<CoordinatorResultDto> {
    const coordinator = await this.findCoordinatorDocumentById(id);

    this.log.debug(`Deleting Coordinator ${coordinator._id}`);

    try {
      await coordinator.delete();
      this.log.debug('Coordinator deleted');
    } catch (e) {
      if (!(e instanceof Error)) {
        throw new InternalServerErrorException(JSON.stringify(e));
      }
      throw new InternalServerErrorException(e.message);
    }
    return CoordinatorResultDto.fromCoordinatorModel(coordinator);
  }
}
