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
  CreateDriverDto,
  DriverQuery,
  DriverResultDto,
  PaginatedDriverResultDto,
  UpdateDriverDto,
} from './driver.dto';
import { DriverService } from './driver.service';
import {
  CreateDriverValidationSchema,
  UpdateDriverValidationSchema,
  DriverQueryParamsSchema,
} from './driver.validation';
import { LoggerService } from '../logger';
import { BodySchemaPipe } from '../utils/bodyValidate.pipe';
import { MongoObjectIdPipe } from '../utils/idValidate.pipe';
import { QueryParamsSchemaPipe } from '../utils/queryParamsValidate.pipe';
import { Roles } from '../auth/auth.decorator';

@Controller('driver')
@Roles('Admin', 'Super Admin')
export class DriverController {
  constructor(
    private readonly log: LoggerService,
    private readonly driverService: DriverService,
  ) {}

  @Get()
  async getDrivers(
    @Query(new QueryParamsSchemaPipe(DriverQueryParamsSchema))
    driverQuery: DriverQuery,
  ): Promise<PaginatedDriverResultDto> {
    return this.driverService.getDrivers(driverQuery);
  }

  @Get(':driverId')
  async getDriver(
    @Param('driverId', MongoObjectIdPipe) driverId: Types.ObjectId,
  ): Promise<DriverResultDto> {
    return this.driverService.findDriverById(driverId);
  }

  @Post()
  async createDriver(
    @Body(new BodySchemaPipe(CreateDriverValidationSchema))
    createDriverBodyDto: CreateDriverDto,
  ): Promise<DriverResultDto> {
    return this.driverService.createDriver(createDriverBodyDto);
  }

  @Patch(':driverId')
  async updateDriver(
    @Param('driverId', MongoObjectIdPipe) driverId: Types.ObjectId,
    @Body(new BodySchemaPipe(UpdateDriverValidationSchema))
    updateDriverBodyDto: UpdateDriverDto,
  ): Promise<DriverResultDto> {
    return this.driverService.updateDriver(driverId, updateDriverBodyDto);
  }

  @Delete(':driverId')
  async deleteDriver(
    @Param('driverId', MongoObjectIdPipe) driverId: Types.ObjectId,
  ) {
    return this.driverService.deleteDriver(driverId);
  }
}
