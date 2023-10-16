import { mongo, PaginateModel, PaginateOptions } from 'mongoose';
import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ConfigService } from '@nestjs/config';
import { Load, LoadDocument } from './load.schema';
import {
  CreateLoadDto,
  LoadQuery,
  LoadResultDto,
  PaginatedLoadResultDto,
  UpdateLoadDto,
} from './load.dto';
import { LoggerService } from '../logger/logger.service';
import {
  MONGO_UNIQUE_INDEX_CONFLICT,
  UNIQUE_CONSTRAIN_ERROR,
} from '../utils/constants';
import { TruckService } from '../truck/truck.service';
import { LocationService } from '../location/location.service';
import { GoogleGeoApiService } from '../googleGeoApi/googleGeoApi.service';

const { MongoError } = mongo;

@Injectable()
export class LoadService {
  private readonly matrixUri?: string;
  private readonly apiKey?: string;
  constructor(
    @InjectModel(Load.name)
    private readonly loadModel: PaginateModel<LoadDocument>,
    private readonly truckService: TruckService,
    private readonly locationService: LocationService,
    private readonly geoApiService: GoogleGeoApiService,
    private configService: ConfigService,
    private readonly log: LoggerService,
  ) {
    this.matrixUri = this.configService.get<string>(
      'google.distanceMatrixBaseUri',
    );
    this.apiKey = this.configService.get<string>('google.key');
  }

  private async findLoadDocumentById(id: string): Promise<LoadDocument> {
    this.log.debug(`Searching for Load ${id}`);
    const load = await this.loadModel.findOne({ _id: id });
    if (!load) {
      throw new NotFoundException(`Load ${id} was not found`);
    }
    this.log.debug(`Load ${load._id}`);
    return load;
  }

  async findLoadById(id: string): Promise<LoadResultDto> {
    const load = await this.findLoadDocumentById(id);
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
    if (query?.search?.truckNumber) {
      const truck = await this.truckService.findTruckByNumber(
        query.search.truckNumber,
      );
      documentQuery.truck = {
        $eq: truck.id,
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
    const [pickLocationResult, deliverLocationResult] =
      await Promise.allSettled([
        createLoadDto?.pick?.geometry?.location &&
          this.locationService.findNearestLocation([
            createLoadDto.pick.geometry.location.lat,
            createLoadDto.pick.geometry.location.lng,
          ]),
        createLoadDto?.deliver?.geometry?.location &&
          this.locationService.findNearestLocation([
            createLoadDto.deliver.geometry.location.lat,
            createLoadDto.deliver.geometry.location.lng,
          ]),
      ]);

    const lastLoadNumber = await this.loadModel
      .findOne({}, { loadNumber: 1 }, { sort: { loadNumber: -1 } })
      .lean();
    const createdLoad = new this.loadModel({
      ...createLoadDto,
      pickLocation:
        pickLocationResult.status === 'fulfilled'
          ? pickLocationResult.value?.id
          : undefined,
      deliverLocation:
        deliverLocationResult.status === 'fulfilled'
          ? deliverLocationResult.value?.id
          : undefined,
      loadNumber: lastLoadNumber?.loadNumber
        ? lastLoadNumber.loadNumber + 1
        : 1,
    });

    try {
      this.log.debug('Saving Load');
      let load = await createdLoad.save();
      this.log.debug('Calculating distance');
      const miles = await this.geoApiService.getDistance(
        [
          load.get('pick.geometry.location')?.lat,
          load.get('pick.geometry.location')?.lng,
        ],
        [
          load.get('deliver.geometry.location')?.lat,
          load.get('deliver.geometry.location')?.lng,
        ],
      );
      this.log.debug(`Updating Load: miles ${miles}`);
      load = await createdLoad.set('miles', miles).save();
      this.log.debug('Load updated');
      return LoadResultDto.fromLoadModel(load);
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

  async updateLoad(
    id: string,
    updateLoadDto: UpdateLoadDto,
  ): Promise<LoadResultDto> {
    let load = await this.findLoadDocumentById(id);
    const [pickLocationResult, deliverLocationResult] =
      await Promise.allSettled([
        updateLoadDto?.pick?.geometry?.location &&
          this.locationService.findNearestLocation([
            updateLoadDto.pick.geometry.location.lat,
            updateLoadDto.pick.geometry.location.lng,
          ]),
        updateLoadDto?.deliver?.geometry?.location &&
          this.locationService.findNearestLocation([
            updateLoadDto.deliver.geometry.location.lat,
            updateLoadDto.deliver.geometry.location.lng,
          ]),
      ]);
    this.log.debug(`Setting new values: ${JSON.stringify(updateLoadDto)}`);
    Object.assign(load, {
      ...updateLoadDto,
      pickLocation:
        pickLocationResult.status === 'fulfilled'
          ? pickLocationResult.value?.id
          : undefined,
      deliverLocation:
        deliverLocationResult.status === 'fulfilled'
          ? deliverLocationResult.value?.id
          : undefined,
    });
    try {
      this.log.debug('Saving Load');
      load = await load.save();
      this.log.debug('Calculating distance');
      const miles = await this.geoApiService.getDistance(
        [
          load.get('pick.geometry.location')?.lat,
          load.get('pick.geometry.location')?.lng,
        ],
        [
          load.get('deliver.geometry.location')?.lat,
          load.get('deliver.geometry.location')?.lng,
        ],
      );
      this.log.debug(`Updating Load: miles ${miles}`);
      load = await load.set('miles', miles).save();
      this.log.debug(`Operator ${load._id} saved`);
      return LoadResultDto.fromLoadModel(load);
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

  async deleteLoad(id: string): Promise<LoadResultDto> {
    const load = await this.findLoadDocumentById(id);

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
