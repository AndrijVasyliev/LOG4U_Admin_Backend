import {
  Controller,
  Get,
  Query,
  Patch,
  Post,
  Body,
  Param,
  PreconditionFailedException,
} from '@nestjs/common';
import { Types } from 'mongoose';
import { AuthDataDto, AuthDto, MobileLoadQuery } from './mobileApp.dto';
import {
  MobileAuthValidationSchema,
  MobileAuthDataValidationSchema,
  MobileLoadQueryParamsSchema,
  MobileUpdateTruckValidationSchema,
  MobileUpdateTruckLocationValidationSchema,
  MobileUpdateLoadStopPickUpStatusValidationSchema,
  MobileUpdateLoadStopDeliveryStatusValidationSchema,
  MobileSetStopPickUpDriversInfoValidationSchema,
  MobileSetStopDeliveryDriversInfoValidationSchema,
  MobileDeviceIdValidationSchema,
} from './mobileApp.validation';
import { GetTruckId, TransformToUpdateDto } from './mobileApp.transformation';
import { LoggerService } from '../logger';
import { Public, Roles } from '../auth/auth.decorator';
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
  SetUpdatedByToApp,
  SetUpdatedByToTracking,
} from '../truck/truck.transformation';
import { QueryParamsSchemaPipe } from '../utils/queryParamsValidate.pipe';
import { BodySchemaPipe } from '../utils/bodyValidate.pipe';
import { BodyTransformPipe } from '../utils/bodyTransform.pipe';
import { MongoObjectIdPipe } from '../utils/idValidate.pipe';
import { MOBILE_PATH_PREFIX } from '../utils/constants';
import { User } from '../utils/user.decorator';

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
    @User() person: PersonAuthResultDto,
    @Body(new BodySchemaPipe(MobileAuthValidationSchema))
    authDto: AuthDto,
  ): Promise<PersonAuthResultDto> {
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
    @User() person: PersonAuthResultDto,
    @Body(new BodySchemaPipe(MobileAuthDataValidationSchema))
    authDataDto: AuthDataDto,
  ): Promise<void> {
    await this.personService.setAppData(person.id, authDataDto);
    return;
  }

  @Get('driver')
  @Roles('Driver', 'OwnerDriver', 'CoordinatorDriver')
  async driver(@User() person: PersonAuthResultDto): Promise<DriverResultDto> {
    return this.driverService.findDriverById(person.id);
  }

  @Get('owner')
  @Roles('Owner', 'OwnerDriver')
  async owner(@User() person: PersonAuthResultDto): Promise<OwnerResultDto> {
    return this.ownerService.findOwnerById(person.id);
  }

  @Get('coordinator')
  @Roles('Coordinator', 'CoordinatorDriver')
  async coordinator(
    @User() person: PersonAuthResultDto,
  ): Promise<CoordinatorResultDto> {
    return this.coordinatorService.findCoordinatorById(person.id);
  }

  @Get('loadsByOwner')
  @Roles('Owner', 'OwnerDriver')
  async getOwnersLoads(
    @User() person: PersonAuthResultDto,
    @Query(new QueryParamsSchemaPipe(MobileLoadQueryParamsSchema))
    loadQuery: MobileLoadQuery,
  ): Promise<PaginatedLoadResultDto> {
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
    @User() person: PersonAuthResultDto,
    @Query(new QueryParamsSchemaPipe(MobileLoadQueryParamsSchema))
    loadQuery: MobileLoadQuery,
  ): Promise<PaginatedLoadResultDto> {
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
    @User() person: PersonAuthResultDto,
    @Query(new QueryParamsSchemaPipe(MobileLoadQueryParamsSchema))
    loadQuery: MobileLoadQuery,
  ): Promise<PaginatedLoadResultDto> {
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
    @User() person: PersonAuthResultDto,
    @Param('loadId', MongoObjectIdPipe) loadId: Types.ObjectId,
    @Param('stopId', MongoObjectIdPipe) stopId: Types.ObjectId,
    @Body(new BodySchemaPipe(MobileUpdateLoadStopPickUpStatusValidationSchema))
    updateLoadStopPickUpStatusBodyDto: UpdateLoadStopPickUpStatusDto,
  ): Promise<LoadResultDto> {
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
    @User() person: PersonAuthResultDto,
    @Param('loadId', MongoObjectIdPipe) loadId: Types.ObjectId,
    @Param('stopId', MongoObjectIdPipe) stopId: Types.ObjectId,
    @Body(
      new BodySchemaPipe(MobileUpdateLoadStopDeliveryStatusValidationSchema),
    )
    updateLoadStopDeliveryStatusBodyDto: UpdateLoadStopDeliveryStatusDto,
  ): Promise<LoadResultDto> {
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
    @User() person: PersonAuthResultDto,
    @Param('loadId', MongoObjectIdPipe) loadId: Types.ObjectId,
    @Param('stopId', MongoObjectIdPipe) stopId: Types.ObjectId,
    @Body(new BodySchemaPipe(MobileSetStopPickUpDriversInfoValidationSchema))
    setStopPickUpDriversInfoDto: CreateStopPickUpDriversInfoDto[],
  ): Promise<LoadResultDto> {
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
    @User() person: PersonAuthResultDto,
    @Param('loadId', MongoObjectIdPipe) loadId: Types.ObjectId,
    @Param('stopId', MongoObjectIdPipe) stopId: Types.ObjectId,
    @Body(new BodySchemaPipe(MobileSetStopDeliveryDriversInfoValidationSchema))
    setStopDeliveryDriversInfoDto: CreateStopDeliveryDriversInfoDto[],
  ): Promise<LoadResultDto> {
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
    @User() person: PersonAuthResultDto,
    @Param('truckId', MongoObjectIdPipe) truckId: Types.ObjectId,
    @Body(
      new BodySchemaPipe(MobileUpdateTruckValidationSchema),
      new BodyTransformPipe(SetUpdatedByToApp),
    )
    updateTruckBodyDto: UpdateTruckDto,
  ): Promise<void> {
    // ToDo move to auth guard
    const truck = await this.truckService.findTruckById(truckId);
    if (
      truck?.driver?.id.toString() !== person.id.toString() &&
      truck?.owner?.id.toString() !== person.id.toString()
    ) {
      throw new PreconditionFailedException(
        `Person ${person.fullName} not a driver and not an owner of truck ${
          truck?.truckNumber ? truck.truckNumber : truckId
        }`,
      );
    }
    await this.truckService.updateTruck(truckId, updateTruckBodyDto);
    return;
  }

  @Public()
  @Post('setTruckLocation')
  // @Roles('Driver', /*'Owner',*/ 'OwnerDriver', 'CoordinatorDriver')
  async setTruckLocation(
    @Body(
      'deviceId',
      new BodySchemaPipe(MobileDeviceIdValidationSchema),
      GetTruckId,
    )
    truckId: Types.ObjectId,
    @Body(
      new BodySchemaPipe(MobileUpdateTruckLocationValidationSchema),
      new BodyTransformPipe(TransformToUpdateDto),
      new BodyTransformPipe(SetUpdatedByToTracking),
    )
    updateTruckBodyDto: UpdateTruckDto,
  ): Promise<void> {
    await this.truckService.updateTruck(truckId, updateTruckBodyDto);
    return;
  }
}
