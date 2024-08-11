import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, ObjectId, Schema as MongooseSchema } from 'mongoose';
import { EMAIL_STATES, EMAIL_TO_TYPES } from '../utils/constants';
import { EmailState, EmailToType } from '../utils/general.dto';
import { UserDocument } from '../user/user.schema';
import { PersonDocument } from '../person/person.schema';

export type EmailDocument = Email & Document;

@Schema({
  _id: false,
  timestamps: false,
})
export class To {
  @Prop({
    required: true,
    immutable: true,
    type: MongooseSchema.Types.ObjectId,
    refPath: 'to.toType',
    // Need to "manually" populate by adding .populate('to.to') to requests
    // ToDo: find out, why autopopulate does not work
    //autopopulate: true,
  })
  to: UserDocument | PersonDocument;

  @Prop({
    required: true,
    immutable: true,
    type: String,
    enum: EMAIL_TO_TYPES,
    default: 'User',
  })
  toType: EmailToType;
}

export const ToSchema = SchemaFactory.createForClass(To);

@Schema({
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  optimisticConcurrency: true,
  collection: 'emails',
})
export class Email {
  @Prop({ required: true, type: String, enum: EMAIL_STATES, default: 'New' })
  state: EmailState;

  @Prop({ required: true })
  from: string;

  @Prop({
    required: true,
    immutable: true,
    type: [ToSchema],
  })
  to: To[];

  @Prop({ required: true })
  subject: string;

  @Prop({ required: true })
  text: string;

  @Prop({ required: false })
  html?: string;

  @Prop({ required: false, type: Object })
  sendResult?: Record<string, any>;

  created_at: Date;

  updated_at: Date;

  _id: ObjectId;
}

export const EmailSchema = SchemaFactory.createForClass(Email);

// EmailSchema.index({ email: 1 }, { unique: true });
