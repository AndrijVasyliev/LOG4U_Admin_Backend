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
import {
  CreateLoadDto,
  LoadQuery,
  LoadQuerySearch,
  LoadResultDto,
  PaginatedLoadResultDto,
  UpdateLoadDto,
} from './load.dto';
import { BodyValidationPipe } from '../utils/bodyValidate.pipe';
import { LoadService } from './load.service';
import { LoggerService } from '../logger';
import {
  CreateLoadValidation,
  UpdateLoadValidation,
  LoadQueryParamsSchema,
} from './load.validation';
import { MongoObjectIdPipe } from '../utils/idValidate.pipe';
import { QueryParamsPipe } from '../utils/queryParamsValidate.pipe';
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
    @Query(new QueryParamsPipe(LoadQueryParamsSchema))
    loadQuery: LoadQuery,
  ): Promise<PaginatedLoadResultDto> {
    return this.loadService.getLoads(loadQuery);
  }

  @Get(':loadId')
  async getLoad(
    @Param('loadId', MongoObjectIdPipe) loadId: string,
  ): Promise<LoadResultDto> {
    return this.loadService.findLoadById(loadId);
  }

  @Post()
  async createLoad(
    @Body(new BodyValidationPipe(CreateLoadValidation))
    createLoadBodyDto: CreateLoadDto,
  ): Promise<LoadResultDto> {
    return this.loadService.createLoad(createLoadBodyDto);
  }

  @Patch(':loadId')
  async updateLoad(
    @Param('loadId', MongoObjectIdPipe) loadId: string,
    @Body(new BodyValidationPipe(UpdateLoadValidation))
    updateLoadBodyDto: UpdateLoadDto,
  ): Promise<LoadResultDto> {
    return this.loadService.updateLoad(loadId, updateLoadBodyDto);
  }

  @Delete(':loadId')
  async deleteLoad(@Param('loadId', MongoObjectIdPipe) loadId: string) {
    return this.loadService.deleteLoad(loadId);
  }
}
