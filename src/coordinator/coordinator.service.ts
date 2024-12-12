import { PaginateModel, PaginateOptions, Types } from 'mongoose';
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { LoggerService } from '../logger';
import {
  COORDINATOR_TYPES,
  MONGO_CONNECTION_NAME,
  OWNER_TYPES,
} from '../utils/constants';
import { Coordinator, CoordinatorDocument } from './coordinator.schema';
import {
  CreateCoordinatorDto,
  CoordinatorQuery,
  CoordinatorResultDto,
  PaginatedCoordinatorResultDto,
  UpdateCoordinatorDto,
} from './coordinator.dto';
import { TruckService } from '../truck/truck.service';
import { escapeForRegExp } from '../utils/escapeForRegExp';

@Injectable()
export class CoordinatorService {
  constructor(
    @InjectModel(Coordinator.name, MONGO_CONNECTION_NAME)
    private readonly coordinatorModel: PaginateModel<CoordinatorDocument>,
    private readonly truckService: TruckService,
    private readonly log: LoggerService,
  ) {}

  private async findCoordinatorDocumentById(
    id: Types.ObjectId,
  ): Promise<CoordinatorDocument> {
    this.log.debug(`Searching for Coordinator ${id}`);
    const coordinator = await this.coordinatorModel
      .findOne({
        _id: id,
        type: { $in: COORDINATOR_TYPES },
      })
      .populate('coordinateTrucks');
    if (!coordinator) {
      throw new NotFoundException(`Coordinator ${id} was not found`);
    }
    this.log.debug(`Coordinator ${coordinator._id}`);

    return coordinator.populate('coordinateTrucks');
  }

  async findCoordinatorById(id: Types.ObjectId): Promise<CoordinatorResultDto> {
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
        entry[0] !== 'search' &&
          entry[0] !== 'owner' &&
          entry[0] !== 'truckNumber' &&
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
    options.populate = ['coordinateTrucks'];
    documentQuery.type = { $in: COORDINATOR_TYPES };
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

    this.log.debug('Saving Coordinator');
    const coordinator = await createdCoordinator.save();
    await coordinator.populate({
      path: 'owner',
      match: { type: { $in: OWNER_TYPES } },
    });

    return CoordinatorResultDto.fromCoordinatorModel(coordinator);
  }

  async updateCoordinator(
    id: Types.ObjectId,
    updateCoordinatorDto: UpdateCoordinatorDto,
  ): Promise<CoordinatorResultDto> {
    const coordinator = await this.findCoordinatorDocumentById(id);
    this.log.debug(
      `Setting new values: ${JSON.stringify(updateCoordinatorDto)}`,
    );
    Object.assign(coordinator, updateCoordinatorDto);
    this.log.debug('Saving Coordinator');
    const savedCoordinator = await coordinator.save();
    this.log.debug(`Coordinator ${savedCoordinator._id} saved`);
    await coordinator.populate({
      path: 'owner',
      match: { type: { $in: OWNER_TYPES } },
    });

    return CoordinatorResultDto.fromCoordinatorModel(coordinator);
  }

  async deleteCoordinator(id: Types.ObjectId): Promise<CoordinatorResultDto> {
    const coordinator = await this.findCoordinatorDocumentById(id);

    this.log.debug(`Deleting Coordinator ${coordinator._id}`);

    await coordinator.deleteOne();
    this.log.debug('Coordinator deleted');

    return CoordinatorResultDto.fromCoordinatorModel(coordinator);
  }
}
