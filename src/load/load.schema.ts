import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, ObjectId, Schema as MongooseSchema } from 'mongoose';
import {
  DEFAULT_CHECK_IN_AS,
  LOAD_STATUSES,
  TRUCK_TYPES,
} from '../utils/constants';
import { LoadStatus, TruckType } from '../utils/general.dto';
import { GeoLocationSchema, Location } from '../location/location.schema';
import { User } from '../user/user.schema';
import { Truck } from '../truck/truck.schema';
import { GeoLocationDto } from '../location/location.dto';

export type LoadDocument = Load & Document;

@Schema({
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  optimisticConcurrency: true,
  collection: 'loads',
})
export class Load {
  @Prop({
    required: true,
    immutable: true,
    type: Number,
  })
  loadNumber: number;

  @Prop({
    required: true,
    type: String,
    enum: LOAD_STATUSES,
  })
  status: LoadStatus;

  @Prop({
    required: true,
    type: GeoLocationSchema,
  })
  pick: GeoLocationDto;

  @Prop({
    required: false,
    type: MongooseSchema.Types.ObjectId,
    ref: 'Location',
    autopopulate: true,
  })
  pickLocation?: Location;

  @Prop({ required: true })
  pickDate: Date;

  @Prop({
    required: true,
    type: GeoLocationSchema,
  })
  deliver: GeoLocationDto;

  @Prop({
    required: false,
    type: MongooseSchema.Types.ObjectId,
    ref: 'Location',
    autopopulate: true,
  })
  deliverLocation?: Location;

  @Prop({ required: false })
  deliverDate?: Date;

  @Prop({
    required: false,
    type: Number,
  })
  miles?: number;

  @Prop({ required: true })
  weight: string;

  @Prop({
    required: true,
    type: [{ required: true, type: String, enum: TRUCK_TYPES }],
    validate: (array: any[]) => {
      return array && array.length > 0;
    },
  })
  truckType: TruckType[];

  @Prop({ required: false })
  rate?: number;

  @Prop({
    required: false,
    type: MongooseSchema.Types.ObjectId,
    ref: 'User',
    autopopulate: true,
  })
  bookedByUser?: User;

  @Prop({ required: false })
  bookedByCompany?: string;

  @Prop({
    required: false,
    type: [MongooseSchema.Types.ObjectId],
    ref: 'User',
    autopopulate: true,
  })
  dispatchers?: User[];

  @Prop({ required: false, default: DEFAULT_CHECK_IN_AS })
  checkInAs?: string;

  @Prop({
    required: false,
    type: MongooseSchema.Types.ObjectId,
    ref: 'Truck',
    autopopulate: true,
  })
  truck?: Truck;

  created_at: Date;

  updated_at: Date;

  _id: ObjectId;
}

export const LoadSchema = SchemaFactory.createForClass(Load);

LoadSchema.index({ loadNumber: 1 }, { unique: true });
LoadSchema.index(
  { truck: 1, state: 1 },
  {
    unique: true,
    hidden: true,
    partialFilterExpression: { status: { $eq: 'In Progress' } },
  },
);
