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
import { LoggerService } from '../logger';
import { Public, Roles } from '../auth/auth.decorator';
import {
  AuthDataDto,
  AuthDto,
  MobileLoadQuery,
  MobileLoadQuerySearch,
} from './mobileApp.dto';
import { PersonAuthResultDto } from '../person/person.dto';
import { DriverResultDto } from '../driver/driver.dto';
import { OwnerResultDto } from '../owner/owner.dto';
import { PaginatedLoadResultDto } from '../load/load.dto';
import { UpdateTruckDto } from '../truck/truck.dto';
import { PersonService } from '../person/person.service';
import { DriverService } from '../driver/driver.service';
import { OwnerService } from '../owner/owner.service';
import { LoadService } from '../load/load.service';
import { TruckService } from '../truck/truck.service';
import { QueryParamsPipe } from '../utils/queryParamsValidate.pipe';
import {
  MobileAuthValidation,
  MobileLoadQueryParamsSchema,
  MobileUpdateTruckValidation,
  MobileUpdateTruckLocationValidation,
  MobileAuthDataValidation,
} from './mobileApp.validation';
import { BodyValidationPipe } from '../utils/bodyValidate.pipe';

@Controller('mobileApp')
// @Roles('Driver', 'Owner', 'OwnerDriver')
export class MobileAppController {
  constructor(
    private readonly log: LoggerService,
    private readonly personService: PersonService,
    private readonly driverService: DriverService,
    private readonly ownerService: OwnerService,
    private readonly loadService: LoadService,
    private readonly truckService: TruckService,
  ) {}
  // ToDo remove after switching to new auth schema
  @Patch('auth')
  @Roles('Driver', 'Owner', 'OwnerDriver', 'CoordinatorDriver')
  async auth(
    @Req() request: Request,
    @Body(new BodyValidationPipe(MobileAuthValidation))
    authDto: AuthDto,
  ): Promise<DriverResultDto> {
    const { user: person } = request as unknown as {
      user: PersonAuthResultDto;
    };
    const { deviceId } = authDto;
    if (!deviceId) {
      throw new BadRequestException(`No deviceId in auth request`);
    }
    if (person.deviceId !== deviceId) {
      await this.personService.setDeviceId(person.id, deviceId);
    }
    return this.driverService.findDriverById(person.id);
  }

  @Patch('setAuth')
  @Roles('Driver', 'Owner', 'OwnerDriver', 'CoordinatorDriver')
  async setAuth(
    @Req() request: Request,
    @Body(new BodyValidationPipe(MobileAuthValidation))
    authDto: AuthDto,
  ): Promise<PersonAuthResultDto> {
    const { user: person } = request as unknown as {
      user: PersonAuthResultDto;
    };
    const { force, deviceId } = authDto;
    if (force && person.deviceId === deviceId) {
      throw new PreconditionFailedException('Logged from this device already');
    } else if (!force && person.deviceId !== deviceId) {
      throw new PreconditionFailedException('Logged from other device');
    } else if (person.deviceId === deviceId) {
      return person;
    }
    return await this.personService.setDeviceId(person.id, deviceId);
  }

  @Patch('setAppData')
  @Roles('Driver', 'Owner', 'OwnerDriver', 'CoordinatorDriver')
  async setAppData(
    @Req() request: Request,
    @Body(new BodyValidationPipe(MobileAuthDataValidation))
    authDataDto: AuthDataDto,
  ): Promise<void> {
    const { user: person } = request as unknown as {
      user: PersonAuthResultDto;
    };
    await this.personService.setAppData(person.id, authDataDto);
    return;
  }

  @Get('driver')
  @Roles('Driver', 'OwnerDriver', 'CoordinatorDriver')
  async driver(@Req() request: Request): Promise<DriverResultDto> {
    const { user: person } = request as unknown as {
      user: PersonAuthResultDto;
    };
    return this.driverService.findDriverById(person.id);
  }

  @Get('owner')
  @Roles('Owner', 'OwnerDriver')
  async owner(@Req() request: Request): Promise<OwnerResultDto> {
    const { user: person } = request as unknown as {
      user: PersonAuthResultDto;
    };
    return this.ownerService.findOwnerById(person.id);
  }

  @Get('getLoad')
  @Roles('Driver', 'Owner', 'OwnerDriver', 'CoordinatorDriver')
  async getLoad(
    @Req() request: Request,
    @Query(
      new QueryParamsPipe<MobileLoadQuerySearch>(MobileLoadQueryParamsSchema),
    )
    loadQuery: MobileLoadQuery,
  ): Promise<PaginatedLoadResultDto> {
    const { user: person } = request as unknown as {
      user: PersonAuthResultDto;
    };
    const driver = await this.driverService.findDriverById(person.id);
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
  @Roles('Driver', 'Owner', 'OwnerDriver', 'CoordinatorDriver')
  async updateTruck(
    @Req() request: Request,
    @Body(new BodyValidationPipe(MobileUpdateTruckValidation))
    updateTruckBodyDto: UpdateTruckDto,
  ): Promise<UpdateTruckDto> {
    const { user: person } = request as unknown as {
      user: PersonAuthResultDto;
    };
    const driver = await this.driverService.findDriverById(person.id);
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
  // @Roles('Driver', /*'Owner',*/ 'OwnerDriver', 'CoordinatorDriver')
  async setTruckLocation(
    @Req() request: Request,
    @Body(new BodyValidationPipe(MobileUpdateTruckLocationValidation))
    updateTruckLocationBodyDto: {
      deviceId: string;
      location: { coords: { latitude: number; longitude: number } };
    },
  ): Promise<void> {
    const person = await this.personService.getPersonByDeviceId(
      updateTruckLocationBodyDto.deviceId,
    );
    if (!person) {
      throw new PreconditionFailedException(
        `Driver with deviceId ${updateTruckLocationBodyDto.deviceId} does not found`,
      );
    }
    const driver = await this.driverService.findDriverById(person.id);
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
    return;
  }
}
