import {
  Controller,
  Get,
  Req,
  PreconditionFailedException,
  BadRequestException,
  Query,
  Patch,
  Post,
  Body,
} from '@nestjs/common';
import { Request } from 'express';
import { LoggerService } from '../logger/logger.service';
import { Public, Roles } from '../auth/auth.decorator';
import {
  AuthDto,
  MobileLoadQuery,
  MobileLoadQuerySearch,
} from './mobileApp.dto';
import { DriverResultDto } from '../driver/driver.dto';
import { PaginatedLoadResultDto } from '../load/load.dto';
import { UpdateTruckDto } from '../truck/truck.dto';
import { DriverService } from '../driver/driver.service';
import { LoadService } from '../load/load.service';
import { TruckService } from '../truck/truck.service';
import { QueryParamsPipe } from '../utils/queryParamsValidate.pipe';
import {
  MobileAuthValidation,
  MobileLoadQueryParamsSchema,
  MobileUpdateTruckValidation,
  MobileUpdateTruckLocationValidation,
} from './mobileApp.validation';
import { BodyValidationPipe } from '../utils/bodyValidate.pipe';

@Controller('mobileApp')
@Roles('Driver')
export class MobileAppController {
  constructor(
    private readonly log: LoggerService,
    private readonly driverService: DriverService,
    private readonly loadService: LoadService,
    private readonly truckService: TruckService,
  ) {}

  @Patch('auth')
  async auth(
    @Req() request: Request,
    @Body(new BodyValidationPipe(MobileAuthValidation))
    authDto: AuthDto,
  ): Promise<DriverResultDto> {
    const { user: driver } = request as unknown as {
      user: DriverResultDto;
    };
    const { deviceId } = authDto;
    if (!deviceId) {
      throw new BadRequestException(`No deviceId in auth request`);
    }
    if (driver.deviceId !== deviceId) {
      await this.driverService.setDeviceId(driver.id, deviceId);
    }
    return driver;
  }

  @Get('driver')
  async driver(@Req() request: Request): Promise<DriverResultDto> {
    const { user: driver } = request as unknown as {
      user: DriverResultDto;
    };
    return driver;
  }

  @Get('getLoad')
  async getLoad(
    @Req() request: Request,
    @Query(
      new QueryParamsPipe<MobileLoadQuerySearch>(MobileLoadQueryParamsSchema),
    )
    loadQuery: MobileLoadQuery,
  ): Promise<PaginatedLoadResultDto> {
    const { user: driver } = request as unknown as {
      user: DriverResultDto;
    };
    if (!driver.driveTrucks || driver.driveTrucks.length !== 1) {
      throw new PreconditionFailedException(
        `Driver ${driver.fullName} have no trucks`,
      );
    }
    return this.loadService.getLoads({
      orderby: 'orderNumber',
      direction: 'desc',
      search: { truckNumber: driver.driveTrucks[0].truckNumber },
      ...loadQuery,
    });
  }

  @Patch('updateTruck')
  async updateTruck(
    @Req() request: Request,
    @Body(new BodyValidationPipe(MobileUpdateTruckValidation))
    updateTruckBodyDto: UpdateTruckDto,
  ): Promise<UpdateTruckDto> {
    const { user: driver } = request as unknown as {
      user: DriverResultDto;
    };
    if (!driver.driveTrucks || driver.driveTrucks.length !== 1) {
      throw new PreconditionFailedException(
        `Driver ${driver.fullName} have no trucks`,
      );
    }
    await this.truckService.updateTruck(
      driver.driveTrucks[0].id,
      updateTruckBodyDto,
    );
    return updateTruckBodyDto;
  }

  @Public()
  @Post('setTruckLocation')
  async setTruckLocation(
    @Req() request: Request,
    @Body(new BodyValidationPipe(MobileUpdateTruckLocationValidation))
    updateTruckLocationBodyDto: {
      deviceId: string;
      location: { coords: { latitude: number; longitude: number } };
    },
  ): Promise<string> {
    const driver = await this.driverService.getDriverByDeviceId(
      updateTruckLocationBodyDto.deviceId,
    );
    if (!driver) {
      throw new PreconditionFailedException(
        `Driver with deviceId${updateTruckLocationBodyDto.deviceId} does not found`,
      );
    }
    if (!driver.driveTrucks || driver.driveTrucks.length !== 1) {
      throw new PreconditionFailedException(
        `Driver ${driver.fullName} have no trucks`,
      );
    }
    await this.truckService.updateTruck(driver.driveTrucks[0].id, {
      lastLocation: [
        updateTruckLocationBodyDto.location.coords.latitude,
        updateTruckLocationBodyDto.location.coords.longitude,
      ],
    });
    return 'Location Accepted';
  }
}
