import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, ObjectId } from 'mongoose';
import * as mongoosePaginate from 'mongoose-paginate-v2';
import { LangPriorities } from '../utils/constants';
import { LangPriority } from '../utils/general.dto';

export type OwnerDocument = Owner & Document;

@Schema({
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
    optimisticConcurrency: true,
    collection: 'owners',
})
export class Owner {
    @Prop({ required: true })
    fullName: string;

    @Prop({ required: true })
    birthDate: Date;

    @Prop({ required: true })
    birthPlace: string;

    @Prop({ required: true })
    citizenship: string;

    @Prop({ required: true, enum: LangPriorities })
    languagePriority: LangPriority;

    @Prop({ required: true })
    hiredBy: string;

    @Prop({ required: true })
    hireDate: Date;

    @Prop({ required: true })
    snn: string;

    @Prop({ required: false })
    company?: string;

    @Prop({ required: true })
    insurancePolicy: string;

    @Prop({ required: true })
    insurancePolicyEFF: string;

    @Prop({ required: true })
    insurancePolicyExp: Date;

    @Prop({ required: true })
    address: string;

    @Prop({ required: true })
    phone: string;

    @Prop({ required: false })
    phone2?: string;

    @Prop({ required: true })
    email: string;

    @Prop({ required: true })
    emergencyContactName: string;

    @Prop({ required: false })
    emergencyContactRel?: string;

    @Prop({ required: true })
    emergencyContactPhone: string;

    @Prop({ required: false })
    notes?: string;

    created_at: Date;

    updated_at: Date;

    _id: ObjectId;
}

export const OwnerSchema = SchemaFactory.createForClass(Owner);

// OwnerSchema.index({ fullName: 1, hiredBy: 1 }, { unique: true });

OwnerSchema.plugin(mongoosePaginate);
