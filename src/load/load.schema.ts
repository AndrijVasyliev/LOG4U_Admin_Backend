import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, ObjectId, Schema as MongooseSchema } from 'mongoose';
import * as mongoosePaginate from 'mongoose-paginate-v2';
import * as mongooseAutopopulate from 'mongoose-autopopulate';
import { DEFAULT_CHECK_IN_AS, TruckTypes } from '../utils/constants';
import { TruckType } from '../utils/general.dto';
import { Location } from '../location/location.schema';
import { User } from '../user/user.schema';
import { Truck } from '../truck/truck.schema';

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
    type: MongooseSchema.Types.ObjectId,
    ref: 'Location',
    autopopulate: true,
  })
  pick: Location;

  @Prop({ required: true })
  pickDate: Date;

  @Prop({
    required: true,
    type: MongooseSchema.Types.ObjectId,
    ref: 'Location',
    autopopulate: true,
  })
  deliver: Location;

  @Prop({ required: false })
  deliverDate?: Date;

  @Prop({ required: true })
  weight: string;

  @Prop({
    required: true,
    type: [{ required: true, type: String, enum: TruckTypes }],
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

LoadSchema.plugin(mongoosePaginate);
LoadSchema.plugin(
  mongooseAutopopulate as unknown as (schema: MongooseSchema) => void,
);
