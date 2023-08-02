import { PaginateResult } from 'mongoose';
import { Truck } from './truck.schema';
import {
    GeoPointType,
    LangPriority,
    PaginatedResultDto,
    Query, TruckCertificate,
    TruckCrossborder, TruckEquipment,
    TruckStatus, TruckType,
} from '../utils/general.dto';
import { Prop } from '@nestjs/mongoose';
import { TruckCertificates, TruckCrossborders, TruckEquipments, TruckStatuses, TruckTypes } from '../utils/constants';
import { GeoPointSchema } from '../location/location.schema';

export class CreateTruckDto {
    readonly truckNumber: string;
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
}

export class UpdateTruckDto {
    readonly truckNumber?: string;
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
}

export class TruckQuerySearch {
    readonly truckNumber?: string;
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

export class TruckQuery extends Query<TruckQuerySearch>{
}

export class TruckResultDto extends CreateTruckDto{
    static fromTruckModel(truck: Truck): TruckResultDto {
        return {
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
    }

    readonly id: string;
}

export class PaginatedTruckResultDto extends PaginatedResultDto<TruckResultDto> {
    static from(paginatedTrucks: PaginateResult<Truck>): PaginatedTruckResultDto {
        return {
            items: paginatedTrucks.docs.map((truck) => (TruckResultDto.fromTruckModel(truck))),
            offset: paginatedTrucks.offset,
            limit: paginatedTrucks.limit,
            total: paginatedTrucks.totalDocs,
        };
    }
}
