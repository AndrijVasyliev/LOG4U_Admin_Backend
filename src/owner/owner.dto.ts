import { Owner } from './owner.schema';
import { LangPriorities } from '../utils/constants';

export const LangPriority = (typeof LangPriorities)[number];

export class CreateOwnerDto {
    readonly fullName: string;
    readonly birthDate: Date;
    readonly citizenship: string;
    readonly languagePriority: LangPriority;
    readonly hiredBy: string;
    readonly hireDate: Date;
    readonly snn: string;
    readonly company: string;
    readonly insurancePolicy: string;
    readonly insurancePolicyEFF: string;
    readonly insurancePolicyExp: Date;
    readonly address: string;
    readonly phone: string;
    readonly phone2?: string;
    readonly email: string;
    readonly emergencyContactName: string;
    readonly emergencyContactRel?: string;
    readonly emergencyContactPhone: string
    readonly notes?: string;
}

export class UpdateOwnerDto {
    readonly fullName?: string;
    readonly birthDate?: Date;
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
    readonly emergencyContactPhone?: string
    readonly notes?: string;
}

export class OwnerQuery {
    readonly offset: number;
    readonly limit: number;

    readonly fullName?: string;
    readonly hiredBy?: string;
}

export class OwnerResultDto extends CreateOwnerDto{
    static fromOwnerModel(owner: Owner): OwnerResultDto {
        return {
            id: owner._id.toString(),
            fullName: owner.fullName,
            birthDate: owner.birthDate,
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
}

export class PaginatedResultDto<T> {
    readonly items: Array<T>;
    readonly offset: number;
    readonly limit: number;
    readonly total: number;
}

export class PaginatedOwnerResultDto extends PaginatedResultDto<OwnerResultDto> {
    static from(
        items: OwnerResultDto[],
        offset: number,
        limit: number,
        total: number,
    ): PaginatedOwnerResultDto {
        return {
            items: items,
            offset,
            limit,
            total,
        };
    }
}
