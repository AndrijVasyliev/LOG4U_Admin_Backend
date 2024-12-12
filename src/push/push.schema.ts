import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema, Types } from 'mongoose';
import { PUSH_STATES } from '../utils/constants';
import { PushState } from '../utils/general.dto';
import { PersonDocument } from '../person/person.schema';

export type PushDocument = Push & Document;

@Schema({
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  optimisticConcurrency: true,
  collection: 'pushs',
})
export class Push {
  @Prop({
    required: true,
    immutable: true,
    type: MongooseSchema.Types.ObjectId,
    ref: 'Person',
    autopopulate: true,
  })
  to: PersonDocument;

  @Prop({ required: true, type: String, enum: PUSH_STATES, default: 'New' })
  state: PushState;

  @Prop({ required: false })
  title?: string;

  @Prop({ required: false })
  subtitle?: string;

  @Prop({ required: false })
  body?: string;

  @Prop({ required: false, type: Object })
  data?: Record<string, any>;

  @Prop({ required: false })
  badge?: number;

  @Prop({ required: false, type: Object })
  sendResult?: Record<string, any>;

  @Prop({ required: false, type: Object })
  receiptResult?: Record<string, any>;

  created_at: Date;

  updated_at: Date;

  _id: Types.ObjectId;

  readonly id: string;
}

export const PushSchema = SchemaFactory.createForClass(Push);

// PushSchema.index({ push: 1 }, { unique: true });
