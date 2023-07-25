import { mongo, PaginateModel } from 'mongoose';
import {
    ConflictException,
    Injectable,
    InternalServerErrorException,
    NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { LoggerService } from '../logger/logger.service';
import { MONGO_UNIQUE_INDEX_CONFLICT } from '../utils/constants';
import { Owner, OwnerDocument } from './owner.schema';
import { CreateOwnerDto, OwnerQuery, OwnerResultDto, PaginatedOwnerResultDto, UpdateOwnerDto } from './owner.dto';

const { MongoError } = mongo;

@Injectable()
export class OwnerService {
    constructor(
        @InjectModel(Owner.name)
        private readonly ownerModel: PaginateModel<OwnerDocument>,
        private readonly log: LoggerService,
    ) {}

    private async findOwnerById(id: string): Promise<OwnerDocument> {
        this.log.debug(`Searching for Owner ${id}`);
        const owner = await this.ownerModel.findOne({ _id: id });
        if (!owner) {
            throw new NotFoundException(`Owner ${id} was not found`);
        }
        this.log.debug(`Owner ${owner._id}`);

        return owner;
    }

    async findOwner(id: string): Promise<OwnerResultDto> {
        const owner = await this.findOwnerById(id);
        return OwnerResultDto.fromOwnerModel(owner);
    }

    async getOwners(query: OwnerQuery): Promise<PaginatedOwnerResultDto> {
        this.log.debug(`Searching for Owners: ${JSON.stringify(query)}`);

        const documentQuery: Parameters<typeof this.ownerModel.paginate>[0] = {};
        if (query.search) {
            const searchParams = Object.entries(query.search);
            searchParams.forEach((entry) => {
                documentQuery[entry[0]] = { $regex: new RegExp(entry[1], 'i') };
            });
        }

        const options: {limit: number, offset: number, sort?: Record<string, string>} = {
            limit: query.limit,
            offset: query.offset,
        };
        if (query.direction && query.orderby) {
          options.sort = { [query.orderby]: query.direction };
        }

        const res = await this.ownerModel.paginate(documentQuery, options);

      return PaginatedOwnerResultDto.from(res);
    }

    async createOwner(
        createOwnerDto: CreateOwnerDto,
    ): Promise<OwnerResultDto> {
        this.log.debug(`Creating new Owner: ${JSON.stringify(createOwnerDto)}`);
        const createdOwner = new this.ownerModel(createOwnerDto);

        try {
            this.log.debug('Saving Owner');
            const owner = await createdOwner.save();
            return OwnerResultDto.fromOwnerModel(owner);
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

    async updateOwner(
        id: string,
        updateOwnerDto: UpdateOwnerDto,
    ): Promise<OwnerResultDto> {
        const owner = await this.findOwnerById(id);
        this.log.debug(`Setting new values: ${JSON.stringify(updateOwnerDto)}`);
        Object.assign(owner, updateOwnerDto)
        try {
            this.log.debug('Saving Owner');
            const savedOwner = await owner.save();
            this.log.debug(`Operator ${savedOwner._id} saved`);
            return OwnerResultDto.fromOwnerModel(owner);
        } catch (e) {
            if (!(e instanceof Error)) {
                throw new InternalServerErrorException(JSON.stringify(e));
            }
            throw new InternalServerErrorException(e.message);
        }
    }

    async deleteOwner(id: string): Promise<OwnerResultDto> {
        const owner = await this.findOwnerById(id);

        this.log.debug(`Deleting Owner ${owner._id}`);

        try {
            await owner.delete();
            this.log.debug('Owner deleted');
        } catch (e) {
            if (!(e instanceof Error)) {
                throw new InternalServerErrorException(JSON.stringify(e));
            }
            throw new InternalServerErrorException(e.message);
        }
        return OwnerResultDto.fromOwnerModel(owner);
    }
}
