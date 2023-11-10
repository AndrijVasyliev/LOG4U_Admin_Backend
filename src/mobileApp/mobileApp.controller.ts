import {
  Controller,
  Get,
  Req,
  PreconditionFailedException,
  Query,
  Patch,
  Post,
  Body,
} from '@nestjs/common';
import { Request } from 'express';
import { LoggerService } from '../logger/logger.service';
import { Roles } from '../auth/auth.decorator';
import { DriverResultDto } from '../driver/driver.dto';
import { LoadService } from '../load/load.service';
import { PaginatedLoadResultDto } from '../load/load.dto';
import { QueryParamsPipe } from '../utils/queryParamsValidate.pipe';
import { MobileLoadQuery, MobileLoadQuerySearch } from './mobileApp.dto';
import {
  MobileLoadQueryParamsSchema,
  MobileUpdateTruckValidation,
  MobileUpdateTruckLocationValidation,
} from './mobileApp.validation';
import { TruckService } from '../truck/truck.service';
import { BodyValidationPipe } from '../utils/bodyValidate.pipe';
import { TruckResultDto, UpdateTruckDto } from '../truck/truck.dto';

@Controller('mobileApp')
@Roles('Driver')
export class MobileAppController {
  constructor(
    private readonly log: LoggerService,
    private readonly loadService: LoadService,
    private readonly truckService: TruckService,
  ) {}

  @Get('auth')
  async auth(@Req() request: Request): Promise<DriverResultDto> {
    const { user } = request as unknown as {
      user: DriverResultDto;
    };
    return user;
  }

  @Get('getLoad')
  async getLoad(
    @Req() request: Request,
    @Query(
      new QueryParamsPipe<MobileLoadQuerySearch>(MobileLoadQueryParamsSchema),
    )
    loadQuery: MobileLoadQuery,
  ): Promise<PaginatedLoadResultDto> {
    const { user } = request as unknown as {
      user: DriverResultDto;
    };
    if (!user.driveTrucks || user.driveTrucks.length !== 1) {
      throw new PreconditionFailedException(
        `Driver ${user.fullName} have no trucks`,
      );
    }
    return this.loadService.getLoads({
      orderby: 'orderNumber',
      direction: 'desc',
      search: { truckNumber: user.driveTrucks[0].truckNumber },
      ...loadQuery,
    });
  }

  @Patch('updateTruck')
  async updateTruck(
    @Req() request: Request,
    @Body(new BodyValidationPipe(MobileUpdateTruckValidation))
    updateTruckBodyDto: UpdateTruckDto,
  ): Promise<TruckResultDto> {
    const { user } = request as unknown as {
      user: DriverResultDto;
    };
    if (!user.driveTrucks || user.driveTrucks.length !== 1) {
      throw new PreconditionFailedException(
        `Driver ${user.fullName} have no trucks`,
      );
    }
    return this.truckService.updateTruck(
      user.driveTrucks[0].id,
      updateTruckBodyDto,
    );
  }

  @Post('setTruckLocation')
  async setTruckLocation(
    @Req() request: Request,
    @Body(new BodyValidationPipe(MobileUpdateTruckLocationValidation))
    updateTruckLocationBodyDto: any,
  ): Promise<string> {
    this.log.warn(`Geo: ${JSON.stringify(updateTruckLocationBodyDto)}`);
    return 'Super';
  }
}
