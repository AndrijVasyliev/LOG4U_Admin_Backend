import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, ObjectId } from 'mongoose';
import {
  LANG_PRIORITIES,
  PERSON_TYPES,
  COORDINATOR_TYPES,
  DRIVER_TYPES,
} from '../utils/constants';
import { LangPriority, PersonType } from '../utils/general.dto';
import { Truck } from '../truck/truck.schema';
import { Driver } from '../driver/driver.schema';
import { Coordinator } from '../coordinator/coordinator.schema';

export type OwnerDocument = Owner & Document;

@Schema({
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  optimisticConcurrency: true,
  collection: 'persons',
})
export class Owner {
  @Prop({
    required: true,
    immutable: true,
    enum: PERSON_TYPES,
    default: 'Owner',
  })
  type: PersonType;

  @Prop({ required: true })
  fullName: string;

  @Prop({ required: true })
  birthDate: Date;

  @Prop({ required: true })
  birthPlace: string;

  @Prop({ required: true })
  citizenship: string;

  @Prop({ required: true, enum: LANG_PRIORITIES })
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

  readonly ownTrucks?: Truck[];
  readonly coordinators?: Coordinator[];
  readonly drivers?: Driver[];

  created_at: Date;

  updated_at: Date;

  _id: ObjectId;
}

export const OwnerSchema = SchemaFactory.createForClass(Owner);

OwnerSchema.virtual('ownTrucks', {
  ref: 'Truck',
  localField: '_id',
  foreignField: 'owner',
});

OwnerSchema.virtual('coordinators', {
  ref: 'Coordinator',
  localField: '_id',
  foreignField: 'owner',
  match: { type: { $in: COORDINATOR_TYPES } },
});

OwnerSchema.virtual('drivers', {
  ref: 'Driver',
  localField: '_id',
  foreignField: 'owner',
  match: { type: { $in: DRIVER_TYPES } },
});
