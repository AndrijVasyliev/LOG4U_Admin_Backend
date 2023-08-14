import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, ObjectId } from 'mongoose';
import { LangPriorities } from '../utils/constants';
import { LangPriority, PersonType } from '../utils/general.dto';
import { hash } from '../utils/hash';

export type OwnerDriverDocument = OwnerDriver & Document;

@Schema({ optimisticConcurrency: true })
export class OwnerDriver {
  type: PersonType;

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
  driverLicenceType: string;

  @Prop({ required: true })
  driverLicenceNumber: string;

  @Prop({ required: true })
  driverLicenceState: string;

  @Prop({ required: true })
  driverLicenceClass: string;

  @Prop({ required: true })
  driverLicenceExp: Date;

  @Prop({ required: false })
  idDocId?: string;

  @Prop({ required: false })
  idDocType?: string;

  @Prop({ required: false })
  idDocExp?: Date;

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

  @Prop({ required: false })
  appLogin?: string;

  @Prop({
    required: false,
    set: hash,
  })
  appPass?: string;

  created_at: Date;

  updated_at: Date;

  _id: ObjectId;
}

export const OwnerDriverSchema = SchemaFactory.createForClass(OwnerDriver);
