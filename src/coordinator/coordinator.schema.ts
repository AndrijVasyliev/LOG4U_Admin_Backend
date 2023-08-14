import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, ObjectId, Schema as MongooseSchema } from 'mongoose';
import { LangPriorities } from '../utils/constants';
import { LangPriority, PersonType } from '../utils/general.dto';
import { Owner } from '../owner/owner.schema';

export type CoordinatorDocument = Coordinator & Document;

@Schema({ optimisticConcurrency: true })
export class Coordinator {
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

  @Prop({
    required: true,
    type: MongooseSchema.Types.ObjectId,
    ref: 'Owner',
    autopopulate: true,
  })
  owner: Owner;

  created_at: Date;

  updated_at: Date;

  _id: ObjectId;
}

export const CoordinatorSchema = SchemaFactory.createForClass(Coordinator);
