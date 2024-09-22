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
  CreateCoordinatorDriverDto,
  CoordinatorDriverQuery,
  CoordinatorDriverResultDto,
  PaginatedCoordinatorDriverResultDto,
  UpdateCoordinatorDriverDto,
} from './coordinatorDriver.dto';
import { BodyValidationPipe } from '../utils/bodyValidate.pipe';
import { CoordinatorDriverService } from './coordinatorDriver.service';
import { LoggerService } from '../logger';
import {
  CreateCoordinatorDriverValidation,
  UpdateCoordinatorDriverValidation,
  CoordinatorDriverQueryParamsSchema,
} from './coordinatorDriver.validation';
import { MongoObjectIdPipe } from '../utils/idValidate.pipe';
import { QueryParamsPipe } from '../utils/queryParamsValidate.pipe';
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
    @Query(new QueryParamsPipe(CoordinatorDriverQueryParamsSchema))
    coordinatorDriverQuery: CoordinatorDriverQuery,
  ): Promise<PaginatedCoordinatorDriverResultDto> {
    return this.coordinatorDriverService.getCoordinatorDrivers(
      coordinatorDriverQuery,
    );
  }

  @Get(':coordinatorDriverId')
  async getCoordinatorDriver(
    @Param('coordinatorDriverId', MongoObjectIdPipe)
    coordinatorDriverId: string,
  ): Promise<CoordinatorDriverResultDto> {
    return this.coordinatorDriverService.findCoordinatorDriverById(
      coordinatorDriverId,
    );
  }

  @Post()
  async createCoordinatorDriver(
    @Body(new BodyValidationPipe(CreateCoordinatorDriverValidation))
    createCoordinatorDriverBodyDto: CreateCoordinatorDriverDto,
  ): Promise<CoordinatorDriverResultDto> {
    return this.coordinatorDriverService.createCoordinatorDriver(
      createCoordinatorDriverBodyDto,
    );
  }

  @Patch(':coordinatorDriverId')
  async updateCoordinatorDriver(
    @Param('coordinatorDriverId', MongoObjectIdPipe)
    coordinatorDriverId: string,
    @Body(new BodyValidationPipe(UpdateCoordinatorDriverValidation))
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
    coordinatorDriverId: string,
  ) {
    return this.coordinatorDriverService.deleteCoordinatorDriver(
      coordinatorDriverId,
    );
  }
}
