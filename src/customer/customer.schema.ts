import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, ObjectId } from 'mongoose';
import { CUSTOMER_TYPES } from '../utils/constants';
import { CustomerType } from '../utils/general.dto';

export type CustomerDocument = Customer & Document;

@Schema({
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  optimisticConcurrency: true,
  collection: 'customers',
})
export class Customer {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true, type: String, enum: CUSTOMER_TYPES })
  type: CustomerType;

  @Prop({ required: true })
  address1: string;

  @Prop({ required: false })
  address2?: string;

  @Prop({ required: true })
  city: string;

  @Prop({ required: true })
  state: string;

  @Prop({ required: true })
  zipCode: string;

  @Prop({ required: true })
  phone: string;

  @Prop({ required: false })
  fax?: string;

  @Prop({ required: true })
  email: string;

  @Prop({ required: false })
  website?: string;

  created_at: Date;

  updated_at: Date;

  _id: ObjectId;
}

export const CustomerSchema = SchemaFactory.createForClass(Customer);

CustomerSchema.index({ name: 1 }, { unique: true });
