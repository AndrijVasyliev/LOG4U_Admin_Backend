import {
  Controller,
  Get,
  Req,
  PreconditionFailedException,
  Query,
  Patch,
  Post,
  Body,
  Param,
} from '@nestjs/common';
import { Request } from 'express';
import { LoggerService } from '../logger';
import { Public, Roles } from '../auth/auth.decorator';
import { AuthDataDto, AuthDto, MobileLoadQuery } from './mobileApp.dto';
import { PersonAuthResultDto } from '../person/person.dto';
import { DriverResultDto } from '../driver/driver.dto';
import { OwnerResultDto } from '../owner/owner.dto';
import { CoordinatorResultDto } from '../coordinator/coordinator.dto';
import {
  CreateStopDeliveryDriversInfoDto,
  CreateStopPickUpDriversInfoDto,
  LoadResultDto,
  PaginatedLoadResultDto,
  UpdateLoadStopDeliveryStatusDto,
  UpdateLoadStopPickUpStatusDto,
} from '../load/load.dto';
import { UpdateTruckDto } from '../truck/truck.dto';
import { PersonService } from '../person/person.service';
import { DriverService } from '../driver/driver.service';
import { OwnerService } from '../owner/owner.service';
import { CoordinatorService } from '../coordinator/coordinator.service';
import { LoadService } from '../load/load.service';
import { TruckService } from '../truck/truck.service';
import {
  MobileAuthValidation,
  MobileAuthDataValidation,
  MobileLoadQueryParamsSchema,
  MobileUpdateTruckValidation,
  MobileUpdateTruckLocationValidation,
  MobileUpdateLoadStopPickUpStatusValidation,
  MobileUpdateLoadStopDeliveryStatusValidation,
  MobileSetStopPickUpDriversInfoValidation,
  MobileSetStopDeliveryDriversInfoValidation,
} from './mobileApp.validation';
import { QueryParamsPipe } from '../utils/queryParamsValidate.pipe';
import { BodyValidationPipe } from '../utils/bodyValidate.pipe';
import { MongoObjectIdPipe } from '../utils/idValidate.pipe';
import { MOBILE_PATH_PREFIX } from '../utils/constants';

// ToDo stripe responses of redundant data
@Controller(`${MOBILE_PATH_PREFIX}`)
export class MobileAppController {
  constructor(
    private readonly log: LoggerService,
    private readonly personService: PersonService,
    private readonly driverService: DriverService,
    private readonly ownerService: OwnerService,
    private readonly coordinatorService: CoordinatorService,
    private readonly loadService: LoadService,
    private readonly truckService: TruckService,
  ) {}

  @Patch('setAuth')
  @Roles('Driver', 'Owner', 'OwnerDriver', 'Coordinator', 'CoordinatorDriver')
  async setAuth(
    @Req() request: Request,
    @Body(new BodyValidationPipe(MobileAuthValidation))
    authDto: AuthDto,
  ): Promise<PersonAuthResultDto> {
    const { user: person } = request as unknown as {
      user: PersonAuthResultDto;
    };
    const { force, deviceId } = authDto;
    if (person.deviceId) {
      if (force && person.deviceId === deviceId) {
        throw new PreconditionFailedException(
          'Logged from this device already',
        );
      } else if (!force && person.deviceId !== deviceId) {
        throw new PreconditionFailedException('Logged from other device');
      } else if (person.deviceId === deviceId) {
        return person;
      }
    }
    return await this.personService.setDeviceId(person.id, deviceId);
  }

  @Patch('setAppData')
  @Roles('Driver', 'Owner', 'OwnerDriver', 'Coordinator', 'CoordinatorDriver')
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

  @Get('coordinator')
  @Roles('Coordinator', 'CoordinatorDriver')
  async coordinator(@Req() request: Request): Promise<CoordinatorResultDto> {
    const { user: person } = request as unknown as {
      user: PersonAuthResultDto;
    };
    return this.coordinatorService.findCoordinatorById(person.id);
  }

  @Get('loadsByOwner')
  @Roles('Owner', 'OwnerDriver')
  async getOwnersLoads(
    @Req() request: Request,
    @Query(new QueryParamsPipe(MobileLoadQueryParamsSchema))
    loadQuery: MobileLoadQuery,
  ): Promise<PaginatedLoadResultDto> {
    const { user: person } = request as unknown as {
      user: PersonAuthResultDto;
    };
    const owner = await this.ownerService.findOwnerById(person.id);
    if (!owner.ownTrucks || owner.ownTrucks.length < 1) {
      throw new PreconditionFailedException(
        `Owner ${owner.fullName} own no trucks`,
      );
    }
    return this.loadService.getLoads({
      orderby: 'loadNumber',
      direction: 'desc',
      search: { trucksIds: owner.ownTrucks.map((truck) => truck.id) },
      ...loadQuery,
    });
  }

  @Get('loadsByCoordinator')
  @Roles('Coordinator', 'CoordinatorDriver')
  async getCoordinatorsLoads(
    @Req() request: Request,
    @Query(new QueryParamsPipe(MobileLoadQueryParamsSchema))
    loadQuery: MobileLoadQuery,
  ): Promise<PaginatedLoadResultDto> {
    const { user: person } = request as unknown as {
      user: PersonAuthResultDto;
    };
    const coordinator = await this.coordinatorService.findCoordinatorById(
      person.id,
    );
    if (
      !coordinator.coordinateTrucks ||
      coordinator.coordinateTrucks.length < 1
    ) {
      throw new PreconditionFailedException(
        `Owner ${coordinator.fullName} own no trucks`,
      );
    }
    return this.loadService.getLoads({
      orderby: 'loadNumber',
      direction: 'desc',
      search: {
        trucksIds: coordinator.coordinateTrucks.map((truck) => truck.id),
      },
      ...loadQuery,
    });
  }

  @Get(['getLoad', 'load'])
  @Roles('Driver', 'OwnerDriver', 'CoordinatorDriver')
  async getLoad(
    @Req() request: Request,
    @Query(new QueryParamsPipe(MobileLoadQueryParamsSchema))
    loadQuery: MobileLoadQuery,
  ): Promise<PaginatedLoadResultDto> {
    const { user: person } = request as unknown as {
      user: PersonAuthResultDto;
    };
    const driver = await this.driverService.findDriverById(person.id);
    if (!driver.driveTrucks || driver.driveTrucks.length !== 1) {
      throw new PreconditionFailedException(
        `Driver ${driver.fullName} drive no trucks`,
      );
    }
    return this.loadService.getLoads({
      orderby: 'loadNumber',
      direction: 'desc',
      search: { truckNumber: driver.driveTrucks[0].truckNumber },
      ...loadQuery,
    });
  }

  @Patch('load/:loadId/stopPickUp/:stopId')
  @Roles('Driver', 'OwnerDriver', 'CoordinatorDriver')
  async updateLoadStopPickUpStatus(
    @Req() request: Request,
    @Param('loadId', MongoObjectIdPipe) loadId: string,
    @Param('stopId', MongoObjectIdPipe) stopId: string,
    @Body(new BodyValidationPipe(MobileUpdateLoadStopPickUpStatusValidation))
    updateLoadStopPickUpStatusBodyDto: UpdateLoadStopPickUpStatusDto,
  ): Promise<LoadResultDto> {
    const { user: person } = request as unknown as {
      user: PersonAuthResultDto;
    };
    const driver = await this.driverService.findDriverById(person.id);
    if (!driver.driveTrucks || driver.driveTrucks.length !== 1) {
      throw new PreconditionFailedException(
        `Driver ${driver.fullName} have no trucks`,
      );
    }
    return this.loadService.updateLoadStopPickUpStatus(
      loadId,
      stopId,
      updateLoadStopPickUpStatusBodyDto,
    );
  }

  @Patch('load/:loadId/stopDelivery/:stopId')
  @Roles('Driver', 'OwnerDriver', 'CoordinatorDriver')
  async updateLoadStopDeliveryStatus(
    @Req() request: Request,
    @Param('loadId', MongoObjectIdPipe) loadId: string,
    @Param('stopId', MongoObjectIdPipe) stopId: string,
    @Body(new BodyValidationPipe(MobileUpdateLoadStopDeliveryStatusValidation))
    updateLoadStopDeliveryStatusBodyDto: UpdateLoadStopDeliveryStatusDto,
  ): Promise<LoadResultDto> {
    const { user: person } = request as unknown as {
      user: PersonAuthResultDto;
    };
    const driver = await this.driverService.findDriverById(person.id);
    if (!driver.driveTrucks || driver.driveTrucks.length !== 1) {
      throw new PreconditionFailedException(
        `Driver ${driver.fullName} have no trucks`,
      );
    }
    return this.loadService.updateLoadStopDeliveryStatus(
      loadId,
      stopId,
      updateLoadStopDeliveryStatusBodyDto,
    );
  }

  @Patch('load/:loadId/stopPickUp/:stopId/driversInfo')
  @Roles('Driver', 'OwnerDriver', 'CoordinatorDriver')
  async updateLoadStopPickUpDriversInfo(
    @Req() request: Request,
    @Param('loadId', MongoObjectIdPipe) loadId: string,
    @Param('stopId', MongoObjectIdPipe) stopId: string,
    @Body(new BodyValidationPipe(MobileSetStopPickUpDriversInfoValidation))
    setStopPickUpDriversInfoDto: CreateStopPickUpDriversInfoDto[],
  ): Promise<LoadResultDto> {
    const { user: person } = request as unknown as {
      user: PersonAuthResultDto;
    };
    const driver = await this.driverService.findDriverById(person.id);
    if (!driver.driveTrucks || driver.driveTrucks.length !== 1) {
      throw new PreconditionFailedException(
        `Driver ${driver.fullName} have no trucks`,
      );
    }
    return this.loadService.setStopPickUpDriversInfo(
      loadId,
      stopId,
      setStopPickUpDriversInfoDto,
    );
  }

  @Patch('load/:loadId/stopDelivery/:stopId/driversInfo')
  @Roles('Driver', 'OwnerDriver', 'CoordinatorDriver')
  async updateLoadStopDeliveryDriversInfo(
    @Req() request: Request,
    @Param('loadId', MongoObjectIdPipe) loadId: string,
    @Param('stopId', MongoObjectIdPipe) stopId: string,
    @Body(new BodyValidationPipe(MobileSetStopDeliveryDriversInfoValidation))
    setStopDeliveryDriversInfoDto: CreateStopDeliveryDriversInfoDto[],
  ): Promise<LoadResultDto> {
    const { user: person } = request as unknown as {
      user: PersonAuthResultDto;
    };
    const driver = await this.driverService.findDriverById(person.id);
    if (!driver.driveTrucks || driver.driveTrucks.length !== 1) {
      throw new PreconditionFailedException(
        `Driver ${driver.fullName} have no trucks`,
      );
    }
    return this.loadService.setStopDeliveryDriversInfo(
      loadId,
      stopId,
      setStopDeliveryDriversInfoDto,
    );
  }

  @Patch(['updateTruck/:truckId', 'truck/:truckId'])
  @Roles('Driver', 'Owner', 'OwnerDriver', 'CoordinatorDriver')
  async updateTrucks(
    @Req() request: Request,
    @Param('truckId', MongoObjectIdPipe) truckId: string,
    @Body(new BodyValidationPipe(MobileUpdateTruckValidation))
    updateTruckBodyDto: UpdateTruckDto,
  ): Promise<UpdateTruckDto> {
    const { user: person } = request as unknown as {
      user: PersonAuthResultDto;
    };
    // ToDo move to auth guard
    const truck = await this.truckService.findTruckById(truckId);
    if (truck?.driver?.id !== person.id && truck?.owner?.id !== person.id) {
      throw new PreconditionFailedException(
        `Person ${person.fullName} not a driver and not an owner of truck ${
          truck?.truckNumber ? truck.truckNumber : truckId
        }`,
      );
    }
    await this.truckService.updateTruck(truckId, updateTruckBodyDto);
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
