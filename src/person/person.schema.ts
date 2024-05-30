import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, ObjectId } from 'mongoose';
import { PERSON_TYPES } from '../utils/constants';
import { PersonType } from '../utils/general.dto';
import { hash } from '../utils/hash';
import { CoordinatorDriverSchema } from '../coordinatorDriver/coordinatorDriver.schema';

export type PersonDocument = Person & Document;

@Schema({
  discriminatorKey: 'type',
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  optimisticConcurrency: true,
  collection: 'persons',
})
export class Person {
  @Prop({ required: true, immutable: true, type: String, enum: PERSON_TYPES })
  type: PersonType;

  @Prop({ required: true })
  fullName: string;

  @Prop({ required: false })
  email?: string;

  @Prop({ required: false })
  isAppInDebugMode?: boolean;

  @Prop({ required: false })
  useGoogleMaps?: boolean;

  @Prop({ required: false })
  appLogin?: string;

  @Prop({ required: false, type: Object })
  deviceStatus?: Record<string, any>;

  @Prop({ required: false })
  deviceStatusLastChange?: Date;

  @Prop({ required: false, type: Object })
  appPermissions?: Record<string, any>;

  @Prop({ required: false })
  appPermissionsLastChange?: Date;

  @Prop({ required: false })
  deviceId?: string;

  @Prop({ required: false })
  deviceIdLastChange?: Date;

  @Prop({ required: false })
  pushToken?: string;

  @Prop({ required: false })
  pushTokenLastChange?: Date;

  @Prop({
    required: false,
    set: hash,
  })
  appPass?: string;

  created_at: Date;

  updated_at: Date;

  _id: ObjectId;
}

export const PersonSchema = SchemaFactory.createForClass(Person);

CoordinatorDriverSchema.index({ appLogin: 1 }, { unique: true, sparse: true });
CoordinatorDriverSchema.index({ deviceId: 1 }, { unique: true, sparse: true });
