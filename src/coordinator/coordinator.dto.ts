import { PaginateResult } from 'mongoose';
import { Coordinator } from './coordinator.schema';
import { LangPriority } from '../utils/constants';
import { PaginatedResultDto, Query } from '../utils/general.dto';

export class CreateCoordinatorDto {
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
    readonly emergencyContactPhone: string
    readonly notes?: string;
}

export class UpdateCoordinatorDto {
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
    readonly emergencyContactPhone?: string
    readonly notes?: string;
}

export class CoordinatorQuerySearch {
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
    readonly emergencyContactPhone?: string
}

export class CoordinatorQuery extends Query<CoordinatorQuerySearch>{
}

export class CoordinatorResultDto extends CreateCoordinatorDto {
    static fromCoordinatorModel(coordinator: Coordinator): CoordinatorResultDto {
        return {
            id: coordinator._id.toString(),
            fullName: coordinator.fullName,
            birthDate: coordinator.birthDate,
            birthPlace: coordinator.birthPlace,
            citizenship: coordinator.citizenship,
            languagePriority: coordinator.languagePriority,
            hiredBy: coordinator.hiredBy,
            hireDate: coordinator.hireDate,
            snn: coordinator.snn,
            company: coordinator.company,
            insurancePolicy: coordinator.insurancePolicy,
            insurancePolicyEFF: coordinator.insurancePolicyEFF,
            insurancePolicyExp: coordinator.insurancePolicyExp,
            address: coordinator.address,
            phone: coordinator.phone,
            phone2: coordinator.phone2,
            email: coordinator.email,
            emergencyContactName: coordinator.emergencyContactName,
            emergencyContactRel: coordinator.emergencyContactRel,
            emergencyContactPhone: coordinator.emergencyContactPhone,
            notes: coordinator.notes,
        };
    }

    readonly id: string;
}

export class PaginatedCoordinatorResultDto extends PaginatedResultDto<CoordinatorResultDto> {
    static from(paginatedCoordinators: PaginateResult<Coordinator>): PaginatedCoordinatorResultDto {
        return {
            items: paginatedCoordinators.docs.map((coordinator) => (CoordinatorResultDto.fromCoordinatorModel(coordinator))),
            offset: paginatedCoordinators.offset,
            limit: paginatedCoordinators.limit,
            total: paginatedCoordinators.totalDocs,
        };
    }
}
