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
  CreateDriverDto,
  DriverQuery,
  DriverQuerySearch,
  DriverResultDto,
  PaginatedDriverResultDto,
  UpdateDriverDto,
} from './driver.dto';
import { BodyValidationPipe } from '../utils/bodyValidate.pipe';
import { DriverService } from './driver.service';
import { LoggerService } from '../logger/logger.service';
import {
  CreateDriverValidation,
  UpdateDriverValidation,
  driverQueryParamsSchema,
} from './driver.validation';
import { MongoObjectIdPipe } from '../utils/idValidate.pipe';
import { QueryParamsPipe } from '../utils/queryParamsValidate.pipe';

@Controller('driver')
export class DriverController {
  constructor(
    private readonly log: LoggerService,
    private readonly driverService: DriverService,
  ) {}

  @Get()
  async getDrivers(
    @Query(new QueryParamsPipe<DriverQuerySearch>(driverQueryParamsSchema))
    driverQuery: DriverQuery,
  ): Promise<PaginatedDriverResultDto> {
    return this.driverService.getDrivers(driverQuery);
  }

  @Get(':driverId')
  async getDriver(
    @Param('driverId', MongoObjectIdPipe) driverId: string,
  ): Promise<DriverResultDto> {
    return this.driverService.findDriver(driverId);
  }

  @Post()
  async createDriver(
    @Body(new BodyValidationPipe(CreateDriverValidation))
    createDriverBodyDto: CreateDriverDto,
  ): Promise<DriverResultDto> {
    return this.driverService.createDriver(createDriverBodyDto);
  }

  @Patch(':driverId')
  async updateDriver(
    @Param('driverId', MongoObjectIdPipe) driverId: string,
    @Body(new BodyValidationPipe(UpdateDriverValidation))
    updateDriverBodyDto: UpdateDriverDto,
  ): Promise<DriverResultDto> {
    return this.driverService.updateDriver(driverId, updateDriverBodyDto);
  }

  @Delete(':driverId')
  async deleteDriver(@Param('driverId', MongoObjectIdPipe) driverId: string) {
    return this.driverService.deleteDriver(driverId);
  }
}
