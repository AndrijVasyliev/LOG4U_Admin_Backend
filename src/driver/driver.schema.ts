import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, ObjectId, Schema as MongooseSchema } from 'mongoose';
import { LANG_PRIORITIES, OWNER_TYPES, PERSON_TYPES } from '../utils/constants';
import { LangPriority, PersonType } from '../utils/general.dto';
import { hash } from '../utils/hash';
import { OwnerDocument } from '../owner/owner.schema';
import { TruckDocument } from '../truck/truck.schema';

export type DriverDocument = Driver & Document;

@Schema({
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  optimisticConcurrency: true,
  collection: 'persons',
})
export class Driver {
  @Prop({
    required: true,
    immutable: true,
    type: String,
    enum: PERSON_TYPES,
    default: 'Driver',
  })
  type: PersonType;

  @Prop({ required: true })
  fullName: string;

  @Prop({ required: false })
  birthDate?: Date;

  @Prop({ required: false })
  citizenship?: string;

  @Prop({ required: false, type: String, enum: LANG_PRIORITIES })
  languagePriority?: LangPriority;

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
  owner: OwnerDocument;

  readonly driveTrucks?: TruckDocument[];

  created_at: Date;

  updated_at: Date;

  _id: ObjectId;
}

export const DriverSchema = SchemaFactory.createForClass(Driver);

DriverSchema.virtual('driveTrucks', {
  ref: 'Truck',
  localField: '_id',
  foreignField: 'driver',
});

DriverSchema.index({ appLogin: 1 }, { unique: true, sparse: true });
DriverSchema.index({ owner: 1 }, { sparse: true });
