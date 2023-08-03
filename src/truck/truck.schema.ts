import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, ObjectId } from 'mongoose';
import * as mongoosePaginate from 'mongoose-paginate-v2';
import {
    TruckCertificates,
    TruckCrossborders,
    TruckEquipments,
    TruckStatuses,
    TruckTypes,
} from '../utils/constants';
import {
    GeoPointType,
    TruckCertificate,
    TruckCrossborder, TruckEquipment,
    TruckStatus,
    TruckType,
} from '../utils/general.dto';
import { GeoPointSchema } from '../location/location.schema';

export type TruckDocument = Truck & Document;

@Schema({
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
    optimisticConcurrency: true,
    collection: 'trucks',
})
export class Truck {
    @Prop({ required: true })
    truckNumber: string;

    @Prop({ required: true, enum: TruckStatuses })
    status: TruckStatus;

    @Prop({
        required: false,
        type: GeoPointSchema,
        set: (point?: [number, number]): GeoPointType | void => {
            if (!point) {
                return;
            }
            return {
                type: 'Point',
                coordinates: point,
            }
        },
        get: (point?: GeoPointType): [number, number] | void => {
            if (!point) {
                return;
            }
            return point.coordinates;
        }
    })
    lastLocation?: [number, number];

    @Prop({ required: true, enum: TruckCrossborders })
    crossborder: TruckCrossborder;

    @Prop({ required: false, enum: TruckCertificates })
    certificate?: TruckCertificate;

    @Prop({ required: true, enum: TruckTypes })
    type: TruckType;

    @Prop({ required: false,
        type: [{ required: false, type: String, enum: TruckEquipments }]
    })
    equipment?: TruckEquipment[];

    @Prop({ required: true })
    payload: number;

    @Prop({ required: true })
    grossWeight: string;

    @Prop({ required: true })
    make: string;

    @Prop({ required: true })
    model: string;

    @Prop({ required: true })
    year: number;

    @Prop({ required: true })
    color: string;

    @Prop({ required: true })
    vinCode: string;

    @Prop({ required: true })
    licencePlate: string;

    @Prop({ required: true })
    licenceState: string;

    @Prop({ required: true })
    plateExpires: Date;

    @Prop({ required: true })
    insideDims: string;

    @Prop({ required: true })
    doorDims: string;

    @Prop({ required: true })
    validDims: string;

    created_at: Date;

    updated_at: Date;

    _id: ObjectId;
}

export const TruckSchema = SchemaFactory.createForClass(Truck);

TruckSchema.index({  lastLocation: '2dsphere' });

TruckSchema.plugin(mongoosePaginate);
