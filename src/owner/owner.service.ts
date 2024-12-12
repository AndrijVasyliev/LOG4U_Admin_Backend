import { PaginateModel, PaginateOptions, Types } from 'mongoose';
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { LoggerService } from '../logger';
import { MONGO_CONNECTION_NAME, OWNER_TYPES } from '../utils/constants';
import { Owner, OwnerDocument } from './owner.schema';
import {
  CreateOwnerDto,
  OwnerQuery,
  OwnerResultDto,
  PaginatedOwnerResultDto,
  UpdateOwnerDto,
} from './owner.dto';
import { TruckService } from '../truck/truck.service';
import { escapeForRegExp } from '../utils/escapeForRegExp';

@Injectable()
export class OwnerService {
  constructor(
    @InjectModel(Owner.name, MONGO_CONNECTION_NAME)
    private readonly ownerModel: PaginateModel<OwnerDocument>,
    private readonly truckService: TruckService,
    private readonly log: LoggerService,
  ) {}

  private async findOwnerDocumentById(id: Types.ObjectId): Promise<OwnerDocument> {
    this.log.debug(`Searching for Owner ${id}`);
    const owner = await this.ownerModel
      .findOne({
        _id: id,
        type: { $in: OWNER_TYPES },
      })
      .populate('ownTrucks')
      .populate('coordinators')
      .populate('drivers');
    if (!owner) {
      throw new NotFoundException(`Owner ${id} was not found`);
    }
    this.log.debug(`Owner ${owner._id}`);
    return owner;
  }

  async findOwnerById(id: Types.ObjectId): Promise<OwnerResultDto> {
    const owner = await this.findOwnerDocumentById(id);
    return OwnerResultDto.fromOwnerModel(owner);
  }

  async getOwners(query: OwnerQuery): Promise<PaginatedOwnerResultDto> {
    this.log.debug(`Searching for Owners: ${JSON.stringify(query)}`);

    const documentQuery: Parameters<typeof this.ownerModel.paginate>[0] = {};
    if (query.search) {
      const searchParams = Object.entries(query.search);
      searchParams.forEach((entry) => {
        entry[0] !== 'search' &&
          entry[0] !== 'truckNumber' &&
          (documentQuery[entry[0]] = {
            $regex: new RegExp(escapeForRegExp(entry[1]), 'i'),
          });
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
    options.populate = ['ownTrucks', 'coordinators', 'drivers'];
    documentQuery.type = { $in: OWNER_TYPES };
    const res = await this.ownerModel.paginate(documentQuery, options);

    return PaginatedOwnerResultDto.from(res);
  }

  async createOwner(createOwnerDto: CreateOwnerDto): Promise<OwnerResultDto> {
    this.log.debug(`Creating new Owner: ${JSON.stringify(createOwnerDto)}`);
    const createdOwner = new this.ownerModel(createOwnerDto);

    this.log.debug('Saving Owner');
    const owner = await createdOwner.save();

    return OwnerResultDto.fromOwnerModel(owner);
  }

  async updateOwner(
    id: Types.ObjectId,
    updateOwnerDto: UpdateOwnerDto,
  ): Promise<OwnerResultDto> {
    const owner = await this.findOwnerDocumentById(id);
    this.log.debug(`Setting new values: ${JSON.stringify(updateOwnerDto)}`);
    Object.assign(owner, updateOwnerDto);
    this.log.debug('Saving Owner');
    const savedOwner = await owner.save();
    this.log.debug(`Owner ${savedOwner._id} saved`);

    return OwnerResultDto.fromOwnerModel(owner);
  }

  async deleteOwner(id: Types.ObjectId): Promise<OwnerResultDto> {
    const owner = await this.findOwnerDocumentById(id);

    this.log.debug(`Deleting Owner ${owner._id}`);

    await owner.deleteOne();
    this.log.debug('Owner deleted');

    return OwnerResultDto.fromOwnerModel(owner);
  }
}
