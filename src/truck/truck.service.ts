import { mongo, PaginateModel } from 'mongoose';
import {
    ConflictException,
    Injectable,
    InternalServerErrorException,
    NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { LoggerService } from '../logger/logger.service';
import { EARTH_RADIUS_MILES, MONGO_UNIQUE_INDEX_CONFLICT } from '../utils/constants';
import { Truck, TruckDocument } from './truck.schema';
import { CreateTruckDto, TruckQuery, TruckResultDto, PaginatedTruckResultDto, UpdateTruckDto } from './truck.dto';

const { MongoError } = mongo;

@Injectable()
export class TruckService {
    constructor(
        @InjectModel(Truck.name)
        private readonly truckModel: PaginateModel<TruckDocument>,
        private readonly log: LoggerService,
    ) {}

    private async findTruckById(id: string): Promise<TruckDocument> {
        this.log.debug(`Searching for Truck ${id}`);
        const truck = await this.truckModel.findOne({ _id: id });
        if (!truck) {
            throw new NotFoundException(`Truck ${id} was not found`);
        }
        this.log.debug(`Truck ${truck._id}`);

        return truck;
    }

    async findTruck(id: string): Promise<TruckResultDto> {
        const truck = await this.findTruckById(id);
        return TruckResultDto.fromTruckModel(truck);
    }

    async getTrucks(query: TruckQuery): Promise<PaginatedTruckResultDto> {
        this.log.debug(`Searching for Trucks: ${JSON.stringify(query)}`);

        const documentQuery: Parameters<typeof this.truckModel.paginate>[0] = {};
        if (query.search) {
            const searchParams = Object.entries(query.search);
            searchParams.forEach((entry) => {
                entry[0] !== 'lastLocation' && entry[0] !== 'distance' &&
                (documentQuery[entry[0]] = { $regex: new RegExp(entry[1], 'i') });
            });
        }
        if (query?.search?.lastLocation && query?.search?.distance) {
            documentQuery.lastLocation = {
                $geoWithin: { $centerSphere: [ query.search.lastLocation, query.search.distance / EARTH_RADIUS_MILES ] },
            };
        }

        const options: {limit: number, offset: number, sort?: Record<string, string>} = {
            limit: query.limit,
            offset: query.offset,
        };
        if (query.direction && query.orderby) {
          options.sort = { [query.orderby]: query.direction };
        }

        const res = await this.truckModel.paginate(documentQuery, options);

      return PaginatedTruckResultDto.from(res);
    }

    async createTruck(
        createTruckDto: CreateTruckDto,
    ): Promise<TruckResultDto> {
        this.log.debug(`Creating new Truck: ${JSON.stringify(createTruckDto)}`);
        const createdTruck = new this.truckModel(createTruckDto);

        try {
            this.log.debug('Saving Truck');
            const truck = await createdTruck.save();
            return TruckResultDto.fromTruckModel(truck);
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

    async updateTruck(
        id: string,
        updateTruckDto: UpdateTruckDto,
    ): Promise<TruckResultDto> {
        const truck = await this.findTruckById(id);
        this.log.debug(`Setting new values: ${JSON.stringify(updateTruckDto)}`);
        Object.assign(truck, updateTruckDto)
        try {
            this.log.debug('Saving Truck');
            const savedTruck = await truck.save();
            this.log.debug(`Operator ${savedTruck._id} saved`);
            return TruckResultDto.fromTruckModel(truck);
        } catch (e) {
            if (!(e instanceof Error)) {
                throw new InternalServerErrorException(JSON.stringify(e));
            }
            throw new InternalServerErrorException(e.message);
        }
    }

    async deleteTruck(id: string): Promise<TruckResultDto> {
        const truck = await this.findTruckById(id);

        this.log.debug(`Deleting Truck ${truck._id}`);

        try {
            await truck.delete();
            this.log.debug('Truck deleted');
        } catch (e) {
            if (!(e instanceof Error)) {
                throw new InternalServerErrorException(JSON.stringify(e));
            }
            throw new InternalServerErrorException(e.message);
        }
        return TruckResultDto.fromTruckModel(truck);
    }
}
