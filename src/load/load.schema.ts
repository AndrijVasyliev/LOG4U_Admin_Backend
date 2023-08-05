import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, ObjectId } from 'mongoose';
import * as mongoosePaginate from 'mongoose-paginate-v2';
import { DEFAULT_CHECK_IN_AS, TruckTypes } from '../utils/constants';
import { TruckType } from '../utils/general.dto';

export type LoadDocument = Load & Document;

@Schema({
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  optimisticConcurrency: true,
  collection: 'loads',
})
export class Load {
  @Prop({ required: true })
  pick: string;

  @Prop({ required: true })
  pickDate: Date;

  @Prop({ required: true })
  deliver: string;

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

  // @Prop({ required: false, type: MongooseSchema.Types.ObjectId, ref: 'User' })
  // bookedByUser?: User;

  @Prop({ required: false })
  bookedByCompany?: string;

  // @Prop({ required: false, type: MongooseSchema.Types.ObjectId, ref: 'User' })
  // dispatchers?: User[];

  @Prop({ required: false, default: DEFAULT_CHECK_IN_AS })
  checkInAs?: string;

  created_at: Date;

  updated_at: Date;

  _id: ObjectId;
}

export const LoadSchema = SchemaFactory.createForClass(Load);

// LoadSchema.index({ fullName: 1, hiredBy: 1 }, { unique: true });

LoadSchema.plugin(mongoosePaginate);
