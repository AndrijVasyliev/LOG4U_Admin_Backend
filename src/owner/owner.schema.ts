import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, ObjectId } from 'mongoose';
import { LangPriorities } from '../utils/constants';
import { LangPriority } from './owner.dto';

export type OwnerDocument = Owner & Document;

@Schema({
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
    optimisticConcurrency: true,
    collection: 'roles',
})
export class Owner {
    constructor(role: Owner) {
        this.fullName = role.fullName;
        this.birthDate = role.birthDate;
        this.citizenship = role.citizenship;
        this.languagePriority = role.languagePriority;
        this.hiredBy = role.hiredBy;
        this.hireDate = role.hireDate;
        this.snn = role.snn;
        this.company = role.company;
        this.insurancePolicy = role.insurancePolicy;
        this.insurancePolicyEFF = role.insurancePolicyEFF;
        this.insurancePolicyExp = role.insurancePolicyExp;
        this.address = role.address;
        this.phone = role.phone;
        this.phone2 = role.phone2;
        this.email = role.email;
        this.emergencyContactName = role.emergencyContactName;
        this.emergencyContactRel = role.emergencyContactRel;
        this.emergencyContactPhone = role.emergencyContactPhone;
        this.notes = role.notes;
        this.created_at = role.created_at;
        this.updated_at = role.updated_at;
        this._id = role._id;
    }
    @Prop({ required: true })
    fullName: string;

    @Prop({ required: true })
    birthDate: Date;

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

    @Prop({ required: true })
    company: string;

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
