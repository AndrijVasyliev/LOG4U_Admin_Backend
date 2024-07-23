import { PaginateResult } from 'mongoose';
import { CoordinatorDriver } from './coordinatorDriver.schema';
import {
  LangPriority,
  PaginatedResultDto,
  PersonType,
  Query,
} from '../utils/general.dto';
import { OwnerResultDto } from '../owner/owner.dto';
import { TruckResultDto } from '../truck/truck.dto';

export class CreateCoordinatorDriverDto {
  readonly fullName: string;
  readonly birthDate: Date;
  readonly citizenship: string;
  readonly languagePriority: LangPriority;
  readonly driverLicenceNumber: string;
  readonly driverLicenceState: string;
  readonly driverLicenceExp: Date;
  readonly idDocId?: string;
  readonly idDocType?: string;
  readonly idDocExp?: Date;
  readonly hiredBy: string;
  readonly hireDate: Date;
  readonly snn: string;
  readonly company?: string;
  readonly insurancePolicy: string;
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
  readonly appPass?: string;
  readonly owner: string;
}

export class UpdateCoordinatorDriverDto {
  readonly fullName?: string;
  readonly birthDate?: Date;
  readonly citizenship?: string;
  readonly languagePriority?: LangPriority;
  readonly driverLicenceNumber?: string;
  readonly driverLicenceState?: string;
  readonly driverLicenceExp?: Date;
  readonly idDocId?: string;
  readonly idDocType?: string;
  readonly idDocExp?: Date;
  readonly hiredBy?: string;
  readonly hireDate?: Date;
  readonly snn?: string;
  readonly company?: string;
  readonly insurancePolicy?: string;
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
  readonly appPass?: string;
  readonly owner?: string;
}

export class CoordinatorDriverQuerySearch {
  readonly search?: string;
  readonly fullName?: string;
  readonly citizenship?: string;
  readonly languagePriority?: LangPriority;
  readonly driverLicenceNumber?: string;
  readonly driverLicenceState?: string;
  readonly idDocId?: string;
  readonly idDocType?: string;
  readonly hiredBy?: string;
  readonly snn?: string;
  readonly company?: string;
  readonly insurancePolicy?: string;
  readonly address?: string;
  readonly phone?: string;
  readonly phone2?: string;
  readonly email?: string;
  readonly emergencyContactName?: string;
  readonly emergencyContactRel?: string;
  readonly emergencyContactPhone?: string;
  readonly appLogin?: string;
  readonly truckNumber?: number;
  readonly owner?: string;
}

export interface CoordinatorDriverQuery extends Query<CoordinatorDriverQuerySearch> {}

export class CoordinatorDriverResultDto {
  static fromCoordinatorDriverModel(
    coordinatorDriver: CoordinatorDriver,
  ): CoordinatorDriverResultDto {
    const owner =
      coordinatorDriver.owner &&
      OwnerResultDto.fromOwnerModel(coordinatorDriver.owner);
    const coordinateTrucks =
      coordinatorDriver.coordinateTrucks &&
      coordinatorDriver.coordinateTrucks.length > 0 &&
      coordinatorDriver.coordinateTrucks.map((truck) =>
        TruckResultDto.fromTruckModel(truck),
      );
    const driveTrucks =
      coordinatorDriver.driveTrucks &&
      coordinatorDriver.driveTrucks.length > 0 &&
      coordinatorDriver.driveTrucks.map((truck) =>
        TruckResultDto.fromTruckModel(truck),
      );
    let result: CoordinatorDriverResultDto = {
      id: coordinatorDriver._id.toString(),
      type: coordinatorDriver.type,
      fullName: coordinatorDriver.fullName,
      birthDate: coordinatorDriver.birthDate,
      citizenship: coordinatorDriver.citizenship,
      languagePriority: coordinatorDriver.languagePriority,
      driverLicenceNumber: coordinatorDriver.driverLicenceNumber,
      driverLicenceState: coordinatorDriver.driverLicenceState,
      driverLicenceExp: coordinatorDriver.driverLicenceExp,
      idDocId: coordinatorDriver.idDocId,
      idDocType: coordinatorDriver.idDocType,
      idDocExp: coordinatorDriver.idDocExp,
      hiredBy: coordinatorDriver.hiredBy,
      hireDate: coordinatorDriver.hireDate,
      snn: coordinatorDriver.snn,
      company: coordinatorDriver.company,
      insurancePolicy: coordinatorDriver.insurancePolicy,
      insurancePolicyExp: coordinatorDriver.insurancePolicyExp,
      address: coordinatorDriver.address,
      phone: coordinatorDriver.phone,
      phone2: coordinatorDriver.phone2,
      email: coordinatorDriver.email,
      emergencyContactName: coordinatorDriver.emergencyContactName,
      emergencyContactRel: coordinatorDriver.emergencyContactRel,
      emergencyContactPhone: coordinatorDriver.emergencyContactPhone,
      notes: coordinatorDriver.notes,
      appLogin: coordinatorDriver.appLogin,
    };
    if (owner) {
      result = { ...result, owner };
    }
    if (coordinateTrucks) {
      result = { ...result, coordinateTrucks };
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
  readonly citizenship: string;
  readonly languagePriority: LangPriority;
  readonly driverLicenceNumber: string;
  readonly driverLicenceState: string;
  readonly driverLicenceExp: Date;
  readonly idDocId?: string;
  readonly idDocType?: string;
  readonly idDocExp?: Date;
  readonly hiredBy: string;
  readonly hireDate: Date;
  readonly snn: string;
  readonly company?: string;
  readonly insurancePolicy: string;
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
  readonly owner?: OwnerResultDto;
  readonly coordinateTrucks?: TruckResultDto[];
  readonly driveTrucks?: TruckResultDto[];
}

export class PaginatedCoordinatorDriverResultDto extends PaginatedResultDto<CoordinatorDriverResultDto> {
  static from(
    paginatedCoordinatorDrivers: PaginateResult<CoordinatorDriver>,
  ): PaginatedCoordinatorDriverResultDto {
    return {
      items: paginatedCoordinatorDrivers.docs.map((coordinatorDriver) =>
        CoordinatorDriverResultDto.fromCoordinatorDriverModel(
          coordinatorDriver,
        ),
      ),
      offset: paginatedCoordinatorDrivers.offset,
      limit: paginatedCoordinatorDrivers.limit,
      total: paginatedCoordinatorDrivers.totalDocs,
    };
  }
}
