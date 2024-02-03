import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, ObjectId, Schema as MongooseSchema } from 'mongoose';
import {
  COORDINATOR_TYPES,
  DRIVER_TYPES,
  LANG_PRIORITIES,
  PERSON_TYPES,
} from '../utils/constants';
import { LangPriority, PersonType } from '../utils/general.dto';
import { hash } from '../utils/hash';
import { Truck } from '../truck/truck.schema';
import { Coordinator } from '../coordinator/coordinator.schema';
import { Driver } from '../driver/driver.schema';
import { Owner } from '../owner/owner.schema';

export type OwnerDriverDocument = OwnerDriver & Document;

@Schema({
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  optimisticConcurrency: true,
  collection: 'persons',
})
export class OwnerDriver {
  @Prop({
    required: true,
    immutable: true,
    enum: PERSON_TYPES,
    default: 'OwnerDriver',
  })
  type: PersonType;

  @Prop({ required: true })
  fullName: string;

  @Prop({ required: true })
  birthDate: Date;

  @Prop({ required: true })
  citizenship: string;

  @Prop({ required: true, enum: LANG_PRIORITIES })
  languagePriority: LangPriority;

  @Prop({ required: true })
  driverLicenceNumber: string;

  @Prop({ required: true })
  driverLicenceState: string;

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
  insurancePolicyExp: Date;

  @Prop({ required: true })
  address: string;

  @Prop({ required: true })
  phone: string;

  @Prop({ required: false })
  phone2?: string;

  @Prop({ required: true })
  email: string;

  @Prop({ required: false })
  emergencyContactName: string;

  @Prop({ required: false })
  emergencyContactRel?: string;

  @Prop({ required: false })
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

  @Prop({
    required: true,
    immutable: true,
    type: MongooseSchema.Types.ObjectId,
    ref: 'Owner',
    autopopulate: false, // { match: { type: { $in: OWNER_TYPES } } },
  })
  owner: Owner;

  readonly ownTrucks?: Truck[];
  readonly coordinators?: Coordinator[];
  readonly drivers?: Driver[];
  readonly driveTrucks?: Truck[];

  created_at: Date;

  updated_at: Date;

  _id: ObjectId;
}

export const OwnerDriverSchema = SchemaFactory.createForClass(OwnerDriver);

OwnerDriverSchema.virtual('ownTrucks', {
  ref: 'Truck',
  localField: '_id',
  foreignField: 'owner',
});

OwnerDriverSchema.virtual('coordinators', {
  ref: 'Coordinator',
  localField: '_id',
  foreignField: 'owner',
  match: { type: { $in: COORDINATOR_TYPES } },
});

OwnerDriverSchema.virtual('drivers', {
  ref: 'Driver',
  localField: '_id',
  foreignField: 'owner',
  match: { type: { $in: DRIVER_TYPES } },
});

OwnerDriverSchema.virtual('driveTrucks', {
  ref: 'Truck',
  localField: '_id',
  foreignField: 'driver',
});

OwnerDriverSchema.index({ appLogin: 1 }, { unique: true, sparse: true });
