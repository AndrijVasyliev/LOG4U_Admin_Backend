import { PaginateResult } from 'mongoose';
import { Driver } from './driver.schema';
import {
  LangPriority,
  PaginatedResultDto,
  PersonType,
  Query,
} from '../utils/general.dto';
import { OwnerResultDto } from '../owner/owner.dto';

export class CreateDriverDto {
  readonly fullName: string;
  readonly birthDate?: Date;
  readonly birthPlace?: string;
  readonly citizenship?: string;
  readonly languagePriority?: LangPriority;
  readonly driverLicenceType: string;
  readonly driverLicenceNumber: string;
  readonly driverLicenceState: string;
  readonly driverLicenceClass: string;
  readonly driverLicenceExp: Date;
  readonly idDocId?: string;
  readonly idDocType?: string;
  readonly idDocExp?: Date;
  readonly hiredBy?: string;
  readonly hireDate?: Date;
  readonly address?: string;
  readonly phone: string;
  readonly phone2?: string;
  readonly email?: string;
  readonly emergencyContactName?: string;
  readonly emergencyContactRel?: string;
  readonly emergencyContactPhone?: string;
  readonly notes?: string;
  readonly appLogin?: string;
  readonly appPass?: string;
  readonly owner: string;
}

export class UpdateDriverDto {
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

export class DriverQuerySearch {
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

export class DriverQuery extends Query<DriverQuerySearch> {}

export class DriverResultDto {
  static fromDriverModel(driver: Driver): DriverResultDto {
    const owner = driver.owner && OwnerResultDto.fromOwnerModel(driver.owner);
    let result: DriverResultDto = {
      id: driver._id.toString(),
      type: driver.type,
      fullName: driver.fullName,
      birthDate: driver.birthDate,
      birthPlace: driver.birthPlace,
      citizenship: driver.citizenship,
      languagePriority: driver.languagePriority,
      driverLicenceType: driver.driverLicenceType,
      driverLicenceNumber: driver.driverLicenceNumber,
      driverLicenceState: driver.driverLicenceState,
      driverLicenceClass: driver.driverLicenceClass,
      driverLicenceExp: driver.driverLicenceExp,
      idDocId: driver.idDocId,
      idDocType: driver.idDocType,
      idDocExp: driver.idDocExp,
      hiredBy: driver.hiredBy,
      hireDate: driver.hireDate,
      address: driver.address,
      phone: driver.phone,
      phone2: driver.phone2,
      email: driver.email,
      emergencyContactName: driver.emergencyContactName,
      emergencyContactRel: driver.emergencyContactRel,
      emergencyContactPhone: driver.emergencyContactPhone,
      notes: driver.notes,
      appLogin: driver.appLogin,
      appPass: driver.appPass,
    };
    if (owner) {
      result = { ...result, owner };
    }
    return result;
  }

  readonly id: string;
  readonly type: PersonType;
  readonly fullName: string;
  readonly birthDate?: Date;
  readonly birthPlace?: string;
  readonly citizenship?: string;
  readonly languagePriority?: LangPriority;
  readonly driverLicenceType: string;
  readonly driverLicenceNumber: string;
  readonly driverLicenceState: string;
  readonly driverLicenceClass: string;
  readonly driverLicenceExp: Date;
  readonly idDocId?: string;
  readonly idDocType?: string;
  readonly idDocExp?: Date;
  readonly hiredBy?: string;
  readonly hireDate?: Date;
  readonly address?: string;
  readonly phone: string;
  readonly phone2?: string;
  readonly email?: string;
  readonly emergencyContactName?: string;
  readonly emergencyContactRel?: string;
  readonly emergencyContactPhone?: string;
  readonly notes?: string;
  readonly appLogin?: string;
  readonly appPass?: string;
  readonly owner?: OwnerResultDto;
}

export class PaginatedDriverResultDto extends PaginatedResultDto<DriverResultDto> {
  static from(
    paginatedDrivers: PaginateResult<Driver>,
  ): PaginatedDriverResultDto {
    return {
      items: paginatedDrivers.docs.map((driver) =>
        DriverResultDto.fromDriverModel(driver),
      ),
      offset: paginatedDrivers.offset,
      limit: paginatedDrivers.limit,
      total: paginatedDrivers.totalDocs,
    };
  }
}
