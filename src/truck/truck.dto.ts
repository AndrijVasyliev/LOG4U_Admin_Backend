import { PaginateResult, Types } from 'mongoose';
import { Truck } from './truck.schema';
import {
  GeoPointType,
  LocationUpdaters,
  PaginatedResultDto,
  Query,
  TruckCertificate,
  TruckCrossborder,
  TruckEquipment,
  TruckStatus,
  TruckType,
} from '../utils/general.dto';
import { OwnerResultDto } from '../owner/owner.dto';
import { CoordinatorResultDto } from '../coordinator/coordinator.dto';
import { DriverResultDto } from '../driver/driver.dto';
import { UserResultDto } from '../user/user.dto';

export interface CreateTruckDto {
  readonly truckNumber: number;
  readonly status: TruckStatus;
  readonly lastLocation?: GeoPointType;
  readonly locationUpdatedBy?: LocationUpdaters;
  readonly availabilityLocation?: GeoPointType;
  readonly availabilityAtLocal?: Date;
  readonly crossborder: TruckCrossborder;
  readonly certificate?: TruckCertificate;
  readonly type: TruckType;
  readonly equipment?: TruckEquipment[];
  readonly payload: number;
  readonly grossWeight: string;
  readonly make: string;
  readonly model: string;
  readonly year: number;
  readonly color: string;
  readonly vinCode: string;
  readonly licencePlate: string;
  readonly insideDims: string;
  readonly doorDims: string;
  readonly owner: Types.ObjectId;
  readonly coordinator?: Types.ObjectId;
  readonly driver?: Types.ObjectId;
  readonly reservedAt?: Date;
  readonly reservedBy?: Types.ObjectId;
}

export interface TruckChangeUpdateDocument {
  readonly operationType: 'update';
  readonly updateDescription: {
    readonly updatedFields: {
      // readonly availabilityLocation?: GeoPointType;
      // readonly availabilityAtLocal?: Date;
      readonly __v?: number;
    };
  };
}
export interface TruckChangeInsertDocument {
  readonly operationType: 'insert';
  readonly fullDocument: {
    // readonly availabilityLocation?: GeoPointType;
    // readonly availabilityAtLocal?: Date;
    readonly __v?: number;
  };
}

export type TruckChangeDocument =
  | TruckChangeUpdateDocument
  | TruckChangeInsertDocument;

export type UpdateTruckDto = Partial<CreateTruckDto>;

export interface TruckQuerySearch {
  readonly search?: string;
  readonly truckNumber?: number;
  readonly status?: TruckStatus[];
  readonly lastLocation?: GeoPointType;
  readonly availableBefore?: Date;
  readonly availableAfter?: Date;
  readonly distance?: number;
  readonly crossborder?: TruckCrossborder;
  readonly certificate?: TruckCertificate;
  readonly type?: TruckType;
  readonly equipment?: TruckEquipment;
  readonly grossWeight?: string;
  readonly make?: string;
  readonly model?: string;
  readonly color?: string;
  readonly vinCode?: string;
}

export interface TruckQuerySearchOrder
  extends Omit<
    TruckQuerySearch,
    | 'search'
    | 'lastLocation'
    | 'availableBefore'
    | 'availableAfter'
    | 'distance'
    | 'equipment'
  > {
  readonly payload: number;
  readonly year: number;
  readonly licencePlate: string;
}

export interface TruckQuery
  extends Query<TruckQuerySearch, TruckQuerySearchOrder> {}

export class TruckResultDto {
  static fromTruckModel(
    truck: Truck,
    milesHaversine?: number,
    milesByRoads?: number,
  ): TruckResultDto {
    const owner = truck.owner && OwnerResultDto.fromOwnerModel(truck.owner);
    const coordinator =
      truck.coordinator &&
      CoordinatorResultDto.fromCoordinatorModel(truck.coordinator);
    const driver =
      truck.driver && DriverResultDto.fromDriverModel(truck.driver);
    const reservedBy =
      truck.reservedBy && UserResultDto.fromUserModel(truck.reservedBy);
    let result: TruckResultDto = {
      id: truck._id,
      truckNumber: truck.truckNumber,
      status: truck.status,
      lastLocation: truck.lastLocation,
      locationUpdatedBy: truck.locationUpdatedBy,
      locationUpdatedAt: truck.locationUpdatedAt,
      renewLocationPushMessageAt: truck.renewLocationPushMessageAt,
      availabilityLocation: truck.availabilityLocation,
      availabilityAt: truck.availabilityAt,
      availabilityAtLocal: truck.availabilityAtLocal,
      crossborder: truck.crossborder,
      certificate: truck.certificate,
      type: truck.type,
      equipment: truck.equipment,
      payload: truck.payload,
      grossWeight: truck.grossWeight,
      make: truck.make,
      model: truck.model,
      year: truck.year,
      color: truck.color,
      vinCode: truck.vinCode,
      licencePlate: truck.licencePlate,
      insideDims: truck.insideDims,
      doorDims: truck.doorDims,
      reservedAt: truck.reservedAt,
    };
    if (owner) {
      result = { ...result, owner };
    }
    if (coordinator) {
      result = { ...result, coordinator };
    }
    if (driver) {
      result = { ...result, driver };
    }
    if (Number.isFinite(milesHaversine)) {
      result = { ...result, milesHaversine };
    }
    if (Number.isFinite(milesByRoads)) {
      result = { ...result, milesByRoads };
    }
    if (reservedBy) {
      result = { ...result, reservedBy };
    }
    return result;
  }

  readonly id: Types.ObjectId;
  readonly truckNumber: number;
  readonly status: TruckStatus;
  readonly milesByRoads?: number;
  readonly milesHaversine?: number;
  readonly lastLocation?: GeoPointType;
  readonly locationUpdatedBy?: LocationUpdaters;
  readonly locationUpdatedAt?: Date;
  readonly renewLocationPushMessageAt?: Date;
  readonly availabilityLocation?: GeoPointType;
  readonly availabilityAt?: Date;
  readonly availabilityAtLocal?: Date;
  readonly crossborder: TruckCrossborder;
  readonly certificate?: TruckCertificate;
  readonly type: TruckType;
  readonly equipment?: TruckEquipment[];
  readonly payload: number;
  readonly grossWeight: string;
  readonly make: string;
  readonly model: string;
  readonly year: number;
  readonly color: string;
  readonly vinCode: string;
  readonly licencePlate: string;
  readonly insideDims: string;
  readonly doorDims: string;
  readonly owner?: OwnerResultDto;
  readonly coordinator?: CoordinatorResultDto;
  readonly driver?: DriverResultDto;
  readonly reservedAt?: Date;
  readonly reservedBy?: UserResultDto;
}

export type CalculatedDistances = Array<number | undefined> | undefined;

export class PaginatedTruckResultDto extends PaginatedResultDto<TruckResultDto> {
  static from(paginatedTrucks: PaginateResult<Truck>): PaginatedTruckResultDto;
  static from(
    paginatedTrucks: PaginateResult<Truck>,
    haversineDistances: CalculatedDistances,
    roadsDistance: CalculatedDistances,
  ): PaginatedTruckResultDto;

  static from(
    paginatedTrucks: PaginateResult<Truck>,
    haversineDistances?: CalculatedDistances,
    roadsDistance?: CalculatedDistances,
  ): PaginatedTruckResultDto {
    return {
      items: paginatedTrucks.docs.map((truck, index) =>
        haversineDistances && roadsDistance
          ? TruckResultDto.fromTruckModel(
              truck,
              haversineDistances[index],
              roadsDistance[index],
            )
          : TruckResultDto.fromTruckModel(truck),
      ),
      offset: paginatedTrucks.offset,
      limit: paginatedTrucks.limit,
      total: paginatedTrucks.totalDocs,
    };
  }
}

export class TruckResultForMapDto {
  static fromTruckForMapModel(truck: Truck): TruckResultForMapDto {
    return {
      id: truck._id,
      truckNumber: truck.truckNumber,
      status: truck.status,
      lastLocation: truck.lastLocation,
    };
  }

  readonly id: Types.ObjectId;
  readonly truckNumber: number;
  readonly status: TruckStatus;
  readonly lastLocation?: GeoPointType;
}
