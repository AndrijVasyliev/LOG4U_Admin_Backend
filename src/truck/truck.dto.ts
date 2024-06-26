import { PaginateResult } from 'mongoose';
import { Truck } from './truck.schema';
import {
  GeoPointType,
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

export class CreateTruckDto {
  readonly truckNumber: number;
  readonly status: TruckStatus;
  readonly lastLocation?: GeoPointType;
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
  readonly owner: string;
  readonly coordinator?: string;
  readonly driver?: string;
  readonly reservedAt?: Date;
  readonly reservedBy?: string;
}

export class TruckChangeUpdateDocument {
  readonly operationType: 'update';
  readonly updateDescription: {
    readonly updatedFields: {
      readonly availabilityLocation?: GeoPointType;
      readonly availabilityAtLocal?: Date;
      readonly __v?: number;
    };
  };
}
export class TruckChangeInsertDocument {
  readonly operationType: 'insert';
  readonly fullDocument: {
    readonly availabilityLocation?: GeoPointType;
    readonly availabilityAtLocal?: Date;
    readonly __v?: number;
  };
}

export type TruckChangeDocument =
  | TruckChangeUpdateDocument
  | TruckChangeInsertDocument;

export class UpdateTruckDto {
  readonly truckNumber?: number;
  readonly status?: TruckStatus;
  readonly lastLocation?: GeoPointType;
  readonly availabilityLocation?: GeoPointType;
  readonly availabilityAtLocal?: Date;
  readonly crossborder?: TruckCrossborder;
  readonly certificate?: TruckCertificate;
  readonly type?: TruckType;
  readonly equipment?: TruckEquipment[];
  readonly payload?: number;
  readonly grossWeight?: string;
  readonly make?: string;
  readonly model?: string;
  readonly year?: number;
  readonly color?: string;
  readonly vinCode?: string;
  readonly licencePlate?: string;
  readonly insideDims?: string;
  readonly doorDims?: string;
  readonly owner?: string;
  readonly coordinator?: string;
  readonly driver?: string;
  readonly reservedAt?: Date;
  readonly reservedBy?: string;
}

export class TruckQuerySearch {
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

export class TruckQuery extends Query<TruckQuerySearch> {}

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
      id: truck._id.toString(),
      truckNumber: truck.truckNumber,
      status: truck.status,
      lastLocation: truck.lastLocation,
      locationUpdatedAt: truck.locationUpdatedAt,
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

  readonly id: string;
  readonly truckNumber: number;
  readonly status: TruckStatus;
  readonly milesByRoads?: number;
  readonly milesHaversine?: number;
  readonly lastLocation?: GeoPointType;
  readonly locationUpdatedAt?: Date;
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
      id: truck._id.toString(),
      truckNumber: truck.truckNumber,
      status: truck.status,
      lastLocation: truck.lastLocation,
    };
  }

  readonly id: string;
  readonly truckNumber: number;
  readonly status: TruckStatus;
  readonly lastLocation?: GeoPointType;
}
