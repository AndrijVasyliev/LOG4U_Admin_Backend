import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, ObjectId, Schema as MongooseSchema } from 'mongoose';
import { LANG_PRIORITIES, OWNER_TYPES, PERSON_TYPES } from '../utils/constants';
import { LangPriority, PersonType } from '../utils/general.dto';
import { Owner } from '../owner/owner.schema';
import { Truck } from '../truck/truck.schema';
import { hash } from '../utils/hash';

export type CoordinatorDriverDocument = CoordinatorDriver & Document;

@Schema({
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  optimisticConcurrency: true,
  collection: 'persons',
})
export class CoordinatorDriver {
  @Prop({
    required: true,
    immutable: true,
    type: String,
    enum: PERSON_TYPES,
    default: 'CoordinatorDriver',
  })
  type: PersonType;

  @Prop({ required: true })
  fullName: string;

  @Prop({ required: true })
  birthDate: Date;

  @Prop({ required: true })
  citizenship: string;

  @Prop({ required: true, type: String, enum: LANG_PRIORITIES })
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
    type: MongooseSchema.Types.ObjectId,
    ref: 'Owner',
    autopopulate: { match: { type: { $in: OWNER_TYPES } } },
  })
  owner: Owner;

  readonly coordinateTrucks?: Truck[];
  readonly driveTrucks?: Truck[];

  created_at: Date;

  updated_at: Date;

  _id: ObjectId;
}

export const CoordinatorDriverSchema =
  SchemaFactory.createForClass(CoordinatorDriver);

CoordinatorDriverSchema.virtual('coordinateTrucks', {
  ref: 'Truck',
  localField: '_id',
  foreignField: 'coordinator',
});

CoordinatorDriverSchema.virtual('driveTrucks', {
  ref: 'Truck',
  localField: '_id',
  foreignField: 'driver',
});

CoordinatorDriverSchema.index({ appLogin: 1 }, { unique: true, sparse: true });
