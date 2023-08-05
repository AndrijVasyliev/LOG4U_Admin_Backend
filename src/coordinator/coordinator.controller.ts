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
  CreateCoordinatorDto,
  CoordinatorQuery,
  CoordinatorQuerySearch,
  CoordinatorResultDto,
  PaginatedCoordinatorResultDto,
  UpdateCoordinatorDto,
} from './coordinator.dto';
import { BodyValidationPipe } from '../utils/bodyValidate.pipe';
import { CoordinatorService } from './coordinator.service';
import { LoggerService } from '../logger/logger.service';
import {
  CreateCoordinatorValidation,
  UpdateCoordinatorValidation,
  coordinatorQueryParamsSchema,
} from './coordinator.validation';
import { MongoObjectIdPipe } from '../utils/idValidate.pipe';
import { QueryParamsPipe } from '../utils/queryParamsValidate.pipe';

@Controller('coordinator')
export class CoordinatorController {
  constructor(
    private readonly log: LoggerService,
    private readonly coordinatorService: CoordinatorService,
  ) {}

  @Get()
  async getCoordinators(
    @Query(
      new QueryParamsPipe<CoordinatorQuerySearch>(coordinatorQueryParamsSchema),
    )
    coordinatorQuery: CoordinatorQuery,
  ): Promise<PaginatedCoordinatorResultDto> {
    return this.coordinatorService.getCoordinators(coordinatorQuery);
  }

  @Get(':coordinatorId')
  async getCoordinator(
    @Param('coordinatorId', MongoObjectIdPipe) coordinatorId: string,
  ): Promise<CoordinatorResultDto> {
    return this.coordinatorService.findCoordinator(coordinatorId);
  }

  @Post()
  async createCoordinator(
    @Body(new BodyValidationPipe(CreateCoordinatorValidation))
    createCoordinatorBodyDto: CreateCoordinatorDto,
  ): Promise<CoordinatorResultDto> {
    return this.coordinatorService.createCoordinator(createCoordinatorBodyDto);
  }

  @Patch(':coordinatorId')
  async updateCoordinator(
    @Param('coordinatorId', MongoObjectIdPipe) coordinatorId: string,
    @Body(new BodyValidationPipe(UpdateCoordinatorValidation))
    updateCoordinatorBodyDto: UpdateCoordinatorDto,
  ): Promise<CoordinatorResultDto> {
    return this.coordinatorService.updateCoordinator(
      coordinatorId,
      updateCoordinatorBodyDto,
    );
  }

  @Delete(':coordinatorId')
  async deleteCoordinator(
    @Param('coordinatorId', MongoObjectIdPipe) coordinatorId: string,
  ) {
    return this.coordinatorService.deleteCoordinator(coordinatorId);
  }
}
