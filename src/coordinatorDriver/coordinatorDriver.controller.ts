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
  CreateCoordinatorDriverDto,
  CoordinatorDriverQuery,
  CoordinatorDriverResultDto,
  PaginatedCoordinatorDriverResultDto,
  UpdateCoordinatorDriverDto,
} from './coordinatorDriver.dto';
import { BodySchemaPipe } from '../utils/bodyValidate.pipe';
import { CoordinatorDriverService } from './coordinatorDriver.service';
import { LoggerService } from '../logger';
import {
  CreateCoordinatorDriverValidationSchema,
  UpdateCoordinatorDriverValidationSchema,
  CoordinatorDriverQueryParamsSchema,
} from './coordinatorDriver.validation';
import { MongoObjectIdPipe } from '../utils/idValidate.pipe';
import { QueryParamsSchemaPipe } from '../utils/queryParamsValidate.pipe';
import { Roles } from '../auth/auth.decorator';

@Controller('coordinatorDriver')
@Roles('Admin', 'Super Admin')
export class CoordinatorDriverController {
  constructor(
    private readonly log: LoggerService,
    private readonly coordinatorDriverService: CoordinatorDriverService,
  ) {}

  @Get()
  async getCoordinatorDrivers(
    @Query(new QueryParamsSchemaPipe(CoordinatorDriverQueryParamsSchema))
    coordinatorDriverQuery: CoordinatorDriverQuery,
  ): Promise<PaginatedCoordinatorDriverResultDto> {
    return this.coordinatorDriverService.getCoordinatorDrivers(
      coordinatorDriverQuery,
    );
  }

  @Get(':coordinatorDriverId')
  async getCoordinatorDriver(
    @Param('coordinatorDriverId', MongoObjectIdPipe)
    coordinatorDriverId: Types.ObjectId,
  ): Promise<CoordinatorDriverResultDto> {
    return this.coordinatorDriverService.findCoordinatorDriverById(
      coordinatorDriverId,
    );
  }

  @Post()
  async createCoordinatorDriver(
    @Body(new BodySchemaPipe(CreateCoordinatorDriverValidationSchema))
    createCoordinatorDriverBodyDto: CreateCoordinatorDriverDto,
  ): Promise<CoordinatorDriverResultDto> {
    return this.coordinatorDriverService.createCoordinatorDriver(
      createCoordinatorDriverBodyDto,
    );
  }

  @Patch(':coordinatorDriverId')
  async updateCoordinatorDriver(
    @Param('coordinatorDriverId', MongoObjectIdPipe)
    coordinatorDriverId: Types.ObjectId,
    @Body(new BodySchemaPipe(UpdateCoordinatorDriverValidationSchema))
    updateCoordinatorDriverBodyDto: UpdateCoordinatorDriverDto,
  ): Promise<CoordinatorDriverResultDto> {
    return this.coordinatorDriverService.updateCoordinatorDriver(
      coordinatorDriverId,
      updateCoordinatorDriverBodyDto,
    );
  }

  @Delete(':coordinatorDriverId')
  async deleteCoordinatorDriver(
    @Param('coordinatorDriverId', MongoObjectIdPipe)
    coordinatorDriverId: Types.ObjectId,
  ) {
    return this.coordinatorDriverService.deleteCoordinatorDriver(
      coordinatorDriverId,
    );
  }
}
