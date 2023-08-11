import { PaginateResult } from 'mongoose';
import { Owner } from './owner.schema';
import {
  LangPriority,
  Query,
  PaginatedResultDto,
  PersonType,
} from '../utils/general.dto';

export class CreateOwnerDto {
  readonly fullName: string;
  readonly birthDate: Date;
  readonly birthPlace: string;
  readonly citizenship: string;
  readonly languagePriority: LangPriority;
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
}

export class UpdateOwnerDto {
  readonly fullName?: string;
  readonly birthDate?: Date;
  readonly birthPlace?: string;
  readonly citizenship?: string;
  readonly languagePriority?: LangPriority;
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
}

export class OwnerQuerySearch {
  readonly fullName?: string;
  readonly birthPlace?: string;
  readonly citizenship?: string;
  readonly languagePriority?: LangPriority;
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
}

export class OwnerQuery extends Query<OwnerQuerySearch> {}

export class OwnerResultDto extends CreateOwnerDto {
  static fromOwnerModel(owner: Owner): OwnerResultDto {
    return {
      id: owner._id.toString(),
      type: owner.type,
      fullName: owner.fullName,
      birthDate: owner.birthDate,
      birthPlace: owner.birthPlace,
      citizenship: owner.citizenship,
      languagePriority: owner.languagePriority,
      hiredBy: owner.hiredBy,
      hireDate: owner.hireDate,
      snn: owner.snn,
      company: owner.company,
      insurancePolicy: owner.insurancePolicy,
      insurancePolicyEFF: owner.insurancePolicyEFF,
      insurancePolicyExp: owner.insurancePolicyExp,
      address: owner.address,
      phone: owner.phone,
      phone2: owner.phone2,
      email: owner.email,
      emergencyContactName: owner.emergencyContactName,
      emergencyContactRel: owner.emergencyContactRel,
      emergencyContactPhone: owner.emergencyContactPhone,
      notes: owner.notes,
    };
  }

  readonly id: string;
  readonly type: PersonType;
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
