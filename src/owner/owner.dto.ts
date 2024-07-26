import { PaginateResult } from 'mongoose';
import { Owner } from './owner.schema';
import {
  LangPriority,
  Query,
  PaginatedResultDto,
  PersonType,
} from '../utils/general.dto';
import { TruckResultDto } from '../truck/truck.dto';
import { DriverResultDto } from '../driver/driver.dto';
import { CoordinatorResultDto } from '../coordinator/coordinator.dto';

export interface CreateOwnerDto {
  readonly fullName: string;
  readonly birthDate: Date;
  readonly citizenship: string;
  readonly languagePriority: LangPriority;
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
}

export interface UpdateOwnerDto {
  readonly fullName?: string;
  readonly birthDate?: Date;
  readonly citizenship?: string;
  readonly languagePriority?: LangPriority;
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
}

export interface OwnerQuerySearch {
  readonly search?: string;
  readonly fullName?: string;
  readonly citizenship?: string;
  readonly languagePriority?: LangPriority;
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
}

export interface OwnerQueryOrder
  extends Omit<OwnerQuerySearch, 'search' | 'truckNumber'> {
  readonly birthDate?: Date;
  readonly hireDate?: Date;
  readonly insurancePolicyExp?: Date;
}

export interface OwnerQuery extends Query<OwnerQuerySearch, OwnerQueryOrder> {}

export class OwnerResultDto {
  static fromOwnerModel(owner: Owner): OwnerResultDto {
    const ownTrucks =
      owner.ownTrucks &&
      owner.ownTrucks.length > 0 &&
      owner.ownTrucks.map((truck) => TruckResultDto.fromTruckModel(truck));
    const coordinators =
      owner.coordinators &&
      owner.coordinators.length > 0 &&
      owner.coordinators.map((coordinator) =>
        CoordinatorResultDto.fromCoordinatorModel(coordinator),
      );
    const drivers =
      owner.drivers &&
      owner.drivers.length > 0 &&
      owner.drivers.map((driver) => DriverResultDto.fromDriverModel(driver));
    let result: OwnerResultDto = {
      id: owner._id.toString(),
      type: owner.type,
      fullName: owner.fullName,
      birthDate: owner.birthDate,
      citizenship: owner.citizenship,
      languagePriority: owner.languagePriority,
      hiredBy: owner.hiredBy,
      hireDate: owner.hireDate,
      snn: owner.snn,
      company: owner.company,
      insurancePolicy: owner.insurancePolicy,
      insurancePolicyExp: owner.insurancePolicyExp,
      address: owner.address,
      phone: owner.phone,
      phone2: owner.phone2,
      email: owner.email,
      emergencyContactName: owner.emergencyContactName,
      emergencyContactRel: owner.emergencyContactRel,
      emergencyContactPhone: owner.emergencyContactPhone,
      notes: owner.notes,
      appLogin: owner.appLogin,
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
    return result;
  }

  readonly id: string;
  readonly type: PersonType;
  readonly fullName: string;
  readonly birthDate: Date;
  readonly citizenship: string;
  readonly languagePriority: LangPriority;
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
  readonly ownTrucks?: TruckResultDto[];
  readonly coordinators?: CoordinatorResultDto[];
  readonly drivers?: DriverResultDto[];
}

export class PaginatedOwnerResultDto extends PaginatedResultDto<OwnerResultDto> {
  static from(paginatedOwners: PaginateResult<Owner>): PaginatedOwnerResultDto {
    return {
      items: paginatedOwners.docs.map((owner) =>
        OwnerResultDto.fromOwnerModel(owner),
      ),
      offset: paginatedOwners.offset,
      limit: paginatedOwners.limit,
      total: paginatedOwners.totalDocs,
    };
  }
}
