import { mongo, PaginateModel, PaginateOptions } from 'mongoose';
import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Load, LoadDocument } from './load.schema';
import {
  CreateLoadDto,
  LoadQuery,
  LoadResultDto,
  PaginatedLoadResultDto,
  UpdateLoadDto,
} from './load.dto';
import { LoggerService } from '../logger/logger.service';
import { EARTH_RADIUS_MILES, MONGO_UNIQUE_INDEX_CONFLICT } from '../utils/constants';

const { MongoError } = mongo;

@Injectable()
export class LoadService {
  constructor(
    @InjectModel(Load.name)
    private readonly loadModel: PaginateModel<LoadDocument>,
    private readonly log: LoggerService,
  ) {}

  private async findLoadById(id: string): Promise<LoadDocument> {
    this.log.debug(`Searching for Load ${id}`);
    const load = await this.loadModel.findOne({ _id: id });
    if (!load) {
      throw new NotFoundException(`Load ${id} was not found`);
    }
    this.log.debug(`Load ${load._id}`);

    return load;
  }

  async findLoad(id: string): Promise<LoadResultDto> {
    const load = await this.findLoadById(id);
    return LoadResultDto.fromLoadModel(load);
  }

  async getLoads(query: LoadQuery): Promise<PaginatedLoadResultDto> {
    this.log.debug(`Searching for Loads: ${JSON.stringify(query)}`);

    const documentQuery: Parameters<typeof this.loadModel.paginate>[0] = {};
    if (query.search) {
      const searchParams = Object.entries(query.search);
      searchParams.forEach((entry) => {
        entry[0] !== 'loadNumber' &&
          (documentQuery[entry[0]] = { $regex: new RegExp(entry[1], 'i') });
      });
    }
    if (query?.search?.loadNumber) {
      documentQuery.loadNumber = {
        $eq: query.search.loadNumber,
      };
    }

    const options: PaginateOptions = {
      limit: query.limit,
      offset: query.offset,
    };
    if (query.direction && query.orderby) {
      options.sort = { [query.orderby]: query.direction };
    }
    const res = await this.loadModel.paginate(documentQuery, options);

    return PaginatedLoadResultDto.from(res);
  }

  async createLoad(createLoadDto: CreateLoadDto): Promise<LoadResultDto> {
    this.log.debug(`Creating new Load: ${JSON.stringify(createLoadDto)}`);
    const lastLoadNumber = await this.loadModel
      .findOne({}, { loadNumber: 1 }, { sort: { loadNumber: -1 } })
      .lean();
    const createdLoad = new this.loadModel({
      ...createLoadDto,
      loadNumber: lastLoadNumber?.loadNumber
        ? lastLoadNumber.loadNumber + 1
        : 1,
    });

    try {
      this.log.debug('Saving Load');
      const load = await createdLoad.save();
      return LoadResultDto.fromLoadModel(load);
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

  async updateLoad(
    id: string,
    updateLoadDto: UpdateLoadDto,
  ): Promise<LoadResultDto> {
    const load = await this.findLoadById(id);
    this.log.debug(`Setting new values: ${JSON.stringify(updateLoadDto)}`);
    Object.assign(load, updateLoadDto);
    try {
      this.log.debug('Saving Load');
      const savedLoad = await load.save();
      this.log.debug(`Operator ${savedLoad._id} saved`);
      return LoadResultDto.fromLoadModel(load);
    } catch (e) {
      if (!(e instanceof Error)) {
        throw new InternalServerErrorException(JSON.stringify(e));
      }
      throw new InternalServerErrorException(e.message);
    }
  }

  async deleteLoad(id: string): Promise<LoadResultDto> {
    const load = await this.findLoadById(id);

    this.log.debug(`Deleting Load ${load._id}`);

    try {
      await load.delete();
      this.log.debug('Load deleted');
    } catch (e) {
      if (!(e instanceof Error)) {
        throw new InternalServerErrorException(JSON.stringify(e));
      }
      throw new InternalServerErrorException(e.message);
    }
    return LoadResultDto.fromLoadModel(load);
  }
}
