import { PaginateResult } from 'mongoose';
import { OwnerDriver } from './ownerDriver.schema';
import {
  LangPriority,
  Query,
  PaginatedResultDto,
  PersonType,
} from '../utils/general.dto';
import { TruckResultDto } from '../truck/truck.dto';
import { CoordinatorResultDto } from '../coordinator/coordinator.dto';
import { DriverResultDto } from '../driver/driver.dto';

export class CreateOwnerDriverDto {
  readonly fullName: string;
  readonly birthDate: Date;
  readonly birthPlace: string;
  readonly citizenship: string;
  readonly languagePriority: LangPriority;
  readonly driverLicenceType: string;
  readonly driverLicenceNumber: string;
  readonly driverLicenceState: string;
  readonly driverLicenceClass: string;
  readonly driverLicenceExp: Date;
  readonly idDocId?: string;
  readonly idDocType?: string;
  readonly idDocExp?: Date;
  readonly hiredBy: string;
  readonly hireDate: Date;
  readonly snn: string;
  readonly company?: string;
  readonly insurancePolicy: string;
  readonly insurancePolicyEFF: string;
  readonly insurancePolicyExp: Date;
  readonly address: string;
  readonly phone: string;
  readonly phone2?: string;
  readonly email: string;
  readonly emergencyContactName: string;
  readonly emergencyContactRel?: string;
  readonly emergencyContactPhone: string;
  readonly notes?: string;
  readonly appLogin?: string;
  readonly deviceId?: string;
  readonly appPass?: string;
}

export class UpdateOwnerDriverDto {
  readonly fullName?: string;
  readonly birthDate?: Date;
  readonly birthPlace?: string;
  readonly citizenship?: string;
  readonly languagePriority?: LangPriority;
  readonly driverLicenceType?: string;
  readonly driverLicenceNumber?: string;
  readonly driverLicenceState?: string;
  readonly driverLicenceClass?: string;
  readonly driverLicenceExp?: Date;
  readonly idDocId?: string;
  readonly idDocType?: string;
  readonly idDocExp?: Date;
  readonly hiredBy?: string;
  readonly hireDate?: Date;
  readonly snn?: string;
  readonly company?: string;
  readonly insurancePolicy?: string;
  readonly insurancePolicyEFF?: string;
  readonly insurancePolicyExp?: Date;
  readonly address?: string;
  readonly phone?: string;
  readonly phone2?: string;
  readonly email?: string;
  readonly emergencyContactName?: string;
  readonly emergencyContactRel?: string;
  readonly emergencyContactPhone?: string;
  readonly notes?: string;
  readonly appLogin?: string;
  readonly deviceId?: string;
  readonly appPass?: string;
}

export class OwnerDriverQuerySearch {
  readonly search?: string;
  readonly fullName?: string;
  readonly birthPlace?: string;
  readonly citizenship?: string;
  readonly languagePriority?: LangPriority;
  readonly driverLicenceType?: string;
  readonly driverLicenceNumber?: string;
  readonly driverLicenceState?: string;
  readonly driverLicenceClass?: string;
  readonly idDocId?: string;
  readonly idDocType?: string;
  readonly hiredBy?: string;
  readonly snn?: string;
  readonly company?: string;
  readonly insurancePolicy?: string;
  readonly insurancePolicyEFF?: string;
  readonly address?: string;
  readonly phone?: string;
  readonly phone2?: string;
  readonly email?: string;
  readonly emergencyContactName?: string;
  readonly emergencyContactRel?: string;
  readonly emergencyContactPhone?: string;
  readonly appLogin?: string;
  readonly deviceId?: string;
  readonly truckNumber?: number;
  readonly owner?: string;
}

export class OwnerDriverQuery extends Query<OwnerDriverQuerySearch> {}

export class OwnerDriverResultDto {
  static fromOwnerDriverModel(ownerDriver: OwnerDriver): OwnerDriverResultDto {
    const ownTrucks =
      ownerDriver.ownTrucks &&
      ownerDriver.ownTrucks.length > 0 &&
      ownerDriver.ownTrucks.map((truck) =>
        TruckResultDto.fromTruckModel(truck),
      );
    const coordinators =
      ownerDriver.coordinators &&
      ownerDriver.coordinators.length > 0 &&
      ownerDriver.coordinators.map((coordinator) =>
        CoordinatorResultDto.fromCoordinatorModel(coordinator),
      );
    const drivers =
      ownerDriver.drivers &&
      ownerDriver.drivers.length > 0 &&
      ownerDriver.drivers.map((driver) =>
        DriverResultDto.fromDriverModel(driver),
      );
    const driveTrucks =
      ownerDriver.driveTrucks &&
      ownerDriver.driveTrucks.length > 0 &&
      ownerDriver.driveTrucks.map((truck) =>
        TruckResultDto.fromTruckModel(truck),
      );
    let result: OwnerDriverResultDto = {
      id: ownerDriver._id.toString(),
      type: ownerDriver.type,
      fullName: ownerDriver.fullName,
      birthDate: ownerDriver.birthDate,
      birthPlace: ownerDriver.birthPlace,
      citizenship: ownerDriver.citizenship,
      languagePriority: ownerDriver.languagePriority,
      driverLicenceType: ownerDriver.driverLicenceType,
      driverLicenceNumber: ownerDriver.driverLicenceNumber,
      driverLicenceState: ownerDriver.driverLicenceState,
      driverLicenceClass: ownerDriver.driverLicenceClass,
      driverLicenceExp: ownerDriver.driverLicenceExp,
      idDocId: ownerDriver.idDocId,
      idDocType: ownerDriver.idDocType,
      idDocExp: ownerDriver.idDocExp,
      hiredBy: ownerDriver.hiredBy,
      hireDate: ownerDriver.hireDate,
      snn: ownerDriver.snn,
      company: ownerDriver.company,
      insurancePolicy: ownerDriver.insurancePolicy,
      insurancePolicyEFF: ownerDriver.insurancePolicyEFF,
      insurancePolicyExp: ownerDriver.insurancePolicyExp,
      address: ownerDriver.address,
      phone: ownerDriver.phone,
      phone2: ownerDriver.phone2,
      email: ownerDriver.email,
      emergencyContactName: ownerDriver.emergencyContactName,
      emergencyContactRel: ownerDriver.emergencyContactRel,
      emergencyContactPhone: ownerDriver.emergencyContactPhone,
      notes: ownerDriver.notes,
      appLogin: ownerDriver.appLogin,
      deviceId: ownerDriver.deviceId,
    };
    if (ownTrucks) {
      result = { ...result, ownTrucks };
    }
    if (coordinators) {
      result = { ...result, coordinators };
    }
    if (drivers) {
      result = { ...result, drivers };
    }
    if (driveTrucks) {
      result = { ...result, driveTrucks };
    }
    return result;
  }

  readonly id: string;
  readonly type: PersonType;
  readonly fullName: string;
  readonly birthDate: Date;
  readonly birthPlace: string;
  readonly citizenship: string;
  readonly languagePriority: LangPriority;
  readonly driverLicenceType: string;
  readonly driverLicenceNumber: string;
  readonly driverLicenceState: string;
  readonly driverLicenceClass: string;
  readonly driverLicenceExp: Date;
  readonly idDocId?: string;
  readonly idDocType?: string;
  readonly idDocExp?: Date;
  readonly hiredBy: string;
  readonly hireDate: Date;
  readonly snn: string;
  readonly company?: string;
  readonly insurancePolicy: string;
  readonly insurancePolicyEFF: string;
  readonly insurancePolicyExp: Date;
  readonly address: string;
  readonly phone: string;
  readonly phone2?: string;
  readonly email: string;
  readonly emergencyContactName: string;
  readonly emergencyContactRel?: string;
  readonly emergencyContactPhone: string;
  readonly notes?: string;
  readonly appLogin?: string;
  readonly deviceId?: string;
  readonly ownTrucks?: TruckResultDto[];
  readonly coordinators?: CoordinatorResultDto[];
  readonly drivers?: DriverResultDto[];
  readonly driveTrucks?: TruckResultDto[];
}

export class PaginatedOwnerDriverResultDto extends PaginatedResultDto<OwnerDriverResultDto> {
  static from(
    paginatedOwnerDrivers: PaginateResult<OwnerDriver>,
  ): PaginatedOwnerDriverResultDto {
    return {
      items: paginatedOwnerDrivers.docs.map((owner) =>
        OwnerDriverResultDto.fromOwnerDriverModel(owner),
      ),
      offset: paginatedOwnerDrivers.offset,
      limit: paginatedOwnerDrivers.limit,
      total: paginatedOwnerDrivers.totalDocs,
    };
  }
}
