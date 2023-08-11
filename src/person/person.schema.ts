import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, ObjectId } from 'mongoose';
import { LangPriorities, PersonTypes } from '../utils/constants';
import { LangPriority, PersonType } from '../utils/general.dto';

export type PersonDocument = Person & Document;

@Schema({
  discriminatorKey: 'type',
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  optimisticConcurrency: true,
  collection: 'persons',
})
export class Person {
  @Prop({ required: true, immutable: true, enum: PersonTypes })
  type: PersonType;

  @Prop({ required: false })
  birthDate?: Date;

  @Prop({ required: false })
  birthPlace?: string;

  @Prop({ required: false })
  citizenship?: string;

  @Prop({ required: false, enum: LangPriorities })
  languagePriority?: LangPriority;

  @Prop({ required: false })
  hiredBy?: string;

  @Prop({ required: true })
  hireDate: Date;

  // @Prop({ required: true })
  // snn: string;

  // @Prop({ required: false })
  // company?: string;
  //
  // @Prop({ required: true })
  // insurancePolicy: string;
  //
  // @Prop({ required: true })
  // insurancePolicyEFF: string;
  //
  // @Prop({ required: true })
  // insurancePolicyExp: Date;

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

  created_at: Date;

  updated_at: Date;

  _id: ObjectId;
}

export const PersonSchema = SchemaFactory.createForClass(Person);
