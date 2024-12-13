import {
  Controller,
  Get,
  Param,
  Query,
  Body,
  Post,
  Patch,
  Delete,
} from '@nestjs/common';
import { Types } from 'mongoose';
import {
  CreateLoadDto,
  LoadQuery,
  LoadResultDto,
  PaginatedLoadResultDto,
  UpdateLoadDto,
} from './load.dto';
import { BodySchemaPipe } from '../utils/bodyValidate.pipe';
import { LoadService } from './load.service';
import { LoggerService } from '../logger';
import {
  CreateLoadValidationSchema,
  UpdateLoadValidationSchema,
  LoadQueryParamsSchema,
} from './load.validation';
import { MongoObjectIdPipe } from '../utils/idValidate.pipe';
import { QueryParamsSchemaPipe } from '../utils/queryParamsValidate.pipe';
import { Roles } from '../auth/auth.decorator';

@Controller('load')
@Roles('Admin', 'Super Admin')
export class LoadController {
  constructor(
    private readonly log: LoggerService,
    private readonly loadService: LoadService,
  ) {}

  @Get()
  async getLoads(
    @Query(new QueryParamsSchemaPipe(LoadQueryParamsSchema))
    loadQuery: LoadQuery,
  ): Promise<PaginatedLoadResultDto> {
    return this.loadService.getLoads(loadQuery);
  }

  @Get(':loadId')
  async getLoad(
    @Param('loadId', MongoObjectIdPipe) loadId: Types.ObjectId,
  ): Promise<LoadResultDto> {
    return this.loadService.findLoadById(loadId);
  }

  @Post()
  async createLoad(
    @Body(new BodySchemaPipe(CreateLoadValidationSchema))
    createLoadBodyDto: CreateLoadDto,
  ): Promise<LoadResultDto> {
    return this.loadService.createLoad(createLoadBodyDto);
  }

  @Patch(':loadId')
  async updateLoad(
    @Param('loadId', MongoObjectIdPipe) loadId: Types.ObjectId,
    @Body(new BodySchemaPipe(UpdateLoadValidationSchema))
    updateLoadBodyDto: UpdateLoadDto,
  ): Promise<LoadResultDto> {
    return this.loadService.updateLoad(loadId, updateLoadBodyDto);
  }

  @Delete(':loadId')
  async deleteLoad(@Param('loadId', MongoObjectIdPipe) loadId: Types.ObjectId) {
    return this.loadService.deleteLoad(loadId);
  }
}
