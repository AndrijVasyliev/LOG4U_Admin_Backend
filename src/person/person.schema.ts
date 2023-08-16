import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, ObjectId } from 'mongoose';
import { PersonTypes } from '../utils/constants';
import { PersonType } from '../utils/general.dto';

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

  @Prop({ required: true })
  fullName: string;

  @Prop({ required: false })
  notes?: string;

  created_at: Date;

  updated_at: Date;

  _id: ObjectId;
}

export const PersonSchema = SchemaFactory.createForClass(Person);
