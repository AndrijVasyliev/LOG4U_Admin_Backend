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
  CreateCoordinatorDto,
  CoordinatorQuery,
  CoordinatorResultDto,
  PaginatedCoordinatorResultDto,
  UpdateCoordinatorDto,
} from './coordinator.dto';
import { BodySchemaPipe } from '../utils/bodyValidate.pipe';
import { CoordinatorService } from './coordinator.service';
import { LoggerService } from '../logger';
import {
  CreateCoordinatorValidationSchema,
  UpdateCoordinatorValidationSchema,
  CoordinatorQueryParamsSchema,
} from './coordinator.validation';
import { MongoObjectIdPipe } from '../utils/idValidate.pipe';
import { QueryParamsSchemaPipe } from '../utils/queryParamsValidate.pipe';
import { Roles } from '../auth/auth.decorator';

@Controller('coordinator')
@Roles('Admin', 'Super Admin')
export class CoordinatorController {
  constructor(
    private readonly log: LoggerService,
    private readonly coordinatorService: CoordinatorService,
  ) {}

  @Get()
  async getCoordinators(
    @Query(new QueryParamsSchemaPipe(CoordinatorQueryParamsSchema))
    coordinatorQuery: CoordinatorQuery,
  ): Promise<PaginatedCoordinatorResultDto> {
    return this.coordinatorService.getCoordinators(coordinatorQuery);
  }

  @Get(':coordinatorId')
  async getCoordinator(
    @Param('coordinatorId', MongoObjectIdPipe) coordinatorId: Types.ObjectId,
  ): Promise<CoordinatorResultDto> {
    return this.coordinatorService.findCoordinatorById(coordinatorId);
  }

  @Post()
  async createCoordinator(
    @Body(new BodySchemaPipe(CreateCoordinatorValidationSchema))
    createCoordinatorBodyDto: CreateCoordinatorDto,
  ): Promise<CoordinatorResultDto> {
    return this.coordinatorService.createCoordinator(createCoordinatorBodyDto);
  }

  @Patch(':coordinatorId')
  async updateCoordinator(
    @Param('coordinatorId', MongoObjectIdPipe) coordinatorId: Types.ObjectId,
    @Body(new BodySchemaPipe(UpdateCoordinatorValidationSchema))
    updateCoordinatorBodyDto: UpdateCoordinatorDto,
  ): Promise<CoordinatorResultDto> {
    return this.coordinatorService.updateCoordinator(
      coordinatorId,
      updateCoordinatorBodyDto,
    );
  }

  @Delete(':coordinatorId')
  async deleteCoordinator(
    @Param('coordinatorId', MongoObjectIdPipe) coordinatorId: Types.ObjectId,
  ) {
    return this.coordinatorService.deleteCoordinator(coordinatorId);
  }
}
