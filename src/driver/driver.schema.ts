import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, ObjectId } from 'mongoose';
import * as mongoosePaginate from 'mongoose-paginate-v2';
import { LangPriorities } from '../utils/constants';
import { LangPriority } from '../utils/general.dto';

export type DriverDocument = Driver & Document;

@Schema({
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
    optimisticConcurrency: true,
    collection: 'drivers',
})
export class Driver {
    @Prop({ required: true })
    fullName: string;

    @Prop({ required: false })
    birthDate?: Date;

    @Prop({ required: false })
    birthPlace?: string;

    @Prop({ required: false })
    citizenship?: string;

    @Prop({ required: false, enum: LangPriorities })
    languagePriority?: LangPriority;

    @Prop({ required: true })
    driverLicenceType: string;

    @Prop({ required: true })
    driverLicenceNumber: string;

    @Prop({ required: true })
    driverLicenceState: string;

    @Prop({ required: true })
    driverLicenceClass: string;

    @Prop({ required: false })
    driverLicenceExp?: Date;

    @Prop({ required: false })
    idDocId?: string;

    @Prop({ required: false })
    idDocType?: string;

    @Prop({ required: false })
    idDocExp?: Date;

    @Prop({ required: false })
    hiredBy?: string;

    @Prop({ required: false })
    hireDate?: Date;

    @Prop({ required: false })
    address?: string;

    @Prop({ required: true })
    phone: string;

    @Prop({ required: false })
    phone2?: string;

    @Prop({ required: false })
    email?: string;

    @Prop({ required: false })
    emergencyContactName?: string;

    @Prop({ required: false })
    emergencyContactRel?: string;

    @Prop({ required: false })
    emergencyContactPhone?: string;

    @Prop({ required: false })
    notes?: string;

    @Prop({ required: false })
    appLogin?: string;

    @Prop({ required: false })
    appPass?: string;

    created_at: Date;

    updated_at: Date;

    _id: ObjectId;
}

export const DriverSchema = SchemaFactory.createForClass(Driver);

// DriverSchema.index({ fullName: 1, hiredBy: 1 }, { unique: true });

DriverSchema.plugin(mongoosePaginate);
