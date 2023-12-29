import { PaginateResult } from 'mongoose';
import { Truck } from './truck.schema';
import {
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
import { LocationResultDto } from '../location/location.dto';

export class CreateTruckDto {
  readonly truckNumber: number;
  readonly status: TruckStatus;
  readonly lastLocation?: [number, number];
  readonly lastCity?: string;
  readonly locationUpdatedAt?: Date;
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
}

export class UpdateTruckDto {
  readonly truckNumber?: number;
  readonly status?: TruckStatus;
  readonly lastLocation?: [number, number];
  readonly lastCity?: string;
  readonly locationUpdatedAt?: Date;
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
}

export class TruckQuerySearch {
  readonly search?: string;
  readonly truckNumber?: number;
  readonly status?: TruckStatus;
  readonly lastLocation?: [number, number];
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
    const lastCity =
      truck.lastCity && LocationResultDto.fromLocationModel(truck.lastCity);
    const owner = truck.owner && OwnerResultDto.fromOwnerModel(truck.owner);
    const coordinator =
      truck.coordinator &&
      CoordinatorResultDto.fromCoordinatorModel(truck.coordinator);
    const driver =
      truck.driver && DriverResultDto.fromDriverModel(truck.driver);
    let result: TruckResultDto = {
      id: truck._id.toString(),
      truckNumber: truck.truckNumber,
      status: truck.status,
      lastLocation: truck.lastLocation,
      locationUpdatedAt: truck.locationUpdatedAt,
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
    };
    if (lastCity) {
      result = { ...result, lastCity };
    }
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
    return result;
  }

  readonly id: string;
  readonly truckNumber: number;
  readonly status: TruckStatus;
  readonly milesByRoads?: number;
  readonly milesHaversine?: number;
  readonly lastLocation?: [number, number];
  readonly lastCity?: LocationResultDto;
  readonly locationUpdatedAt?: Date;
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
    const lastCity =
      truck.lastCity && LocationResultDto.fromLocationModel(truck.lastCity);
    const owner = truck.owner && OwnerResultDto.fromOwnerModel(truck.owner);
    const coordinator =
      truck.coordinator &&
      CoordinatorResultDto.fromCoordinatorModel(truck.coordinator);
    const driver =
      truck.driver && DriverResultDto.fromDriverModel(truck.driver);
    let result: TruckResultForMapDto = {
      id: truck._id.toString(),
      truckNumber: truck.truckNumber,
      status: truck.status,
      lastLocation: truck.lastLocation,
      locationUpdatedAt: truck.locationUpdatedAt,
    };
    if (lastCity) {
      result = { ...result, lastCity };
    }
    if (owner) {
      result = { ...result, owner };
    }
    if (coordinator) {
      result = { ...result, coordinator };
    }
    if (driver) {
      result = { ...result, driver };
    }
    return result;
  }

  readonly id: string;
  readonly truckNumber: number;
  readonly status: TruckStatus;
  readonly lastLocation?: [number, number];
  readonly lastCity?: LocationResultDto;
  readonly locationUpdatedAt?: Date;
  readonly owner?: OwnerResultDto;
  readonly coordinator?: CoordinatorResultDto;
  readonly driver?: DriverResultDto;
}
