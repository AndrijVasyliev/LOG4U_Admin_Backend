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
import { Owner } from '../owner/owner.schema';
import { Coordinator } from '../coordinator/coordinator.schema';
import { Driver } from '../driver/driver.schema';
import { OwnerResultDto } from '../owner/owner.dto';
import { CoordinatorResultDto } from '../coordinator/coordinator.dto';
import { DriverResultDto } from '../driver/driver.dto';

export class CreateTruckDto {
  readonly truckNumber: number;
  readonly status: TruckStatus;
  readonly lastLocation?: [number, number];
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
  readonly licenceState: string;
  readonly plateExpires: Date;
  readonly insideDims: string;
  readonly doorDims: string;
  readonly validDims: string;
  readonly owner: string;
  readonly coordinator?: string;
  readonly driver?: string;
}

export class UpdateTruckDto {
  readonly truckNumber?: number;
  readonly status?: TruckStatus;
  readonly lastLocation?: [number, number];
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
  readonly licenceState?: string;
  readonly plateExpires?: Date;
  readonly insideDims?: string;
  readonly doorDims?: string;
  readonly validDims?: string;
  readonly owner?: string;
  readonly coordinator?: string;
  readonly driver?: string;
}

export class TruckQuerySearch {
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
  readonly licencePlate?: string;
  readonly licenceState?: string;
}

export class TruckQuery extends Query<TruckQuerySearch> {}

export class TruckResultDto {
  static fromTruckModel(truck: Truck): TruckResultDto {
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
      licenceState: truck.licenceState,
      plateExpires: truck.plateExpires,
      insideDims: truck.insideDims,
      doorDims: truck.doorDims,
      validDims: truck.validDims,
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
    return result;
  }

  readonly id: string;
  readonly truckNumber?: number;
  readonly status?: TruckStatus;
  readonly lastLocation?: [number, number];
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
  readonly licenceState?: string;
  readonly plateExpires?: Date;
  readonly insideDims?: string;
  readonly doorDims?: string;
  readonly validDims?: string;
  readonly owner?: OwnerResultDto;
  readonly coordinator?: CoordinatorResultDto;
  readonly driver?: DriverResultDto;
}

export class PaginatedTruckResultDto extends PaginatedResultDto<TruckResultDto> {
  static from(paginatedTrucks: PaginateResult<Truck>): PaginatedTruckResultDto {
    return {
      items: paginatedTrucks.docs.map((truck) =>
        TruckResultDto.fromTruckModel(truck),
      ),
      offset: paginatedTrucks.offset,
      limit: paginatedTrucks.limit,
      total: paginatedTrucks.totalDocs,
    };
  }
}
