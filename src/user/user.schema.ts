import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, ObjectId } from 'mongoose';
import { ADMIN_ROLES } from '../utils/constants';
import { AdminRole } from '../utils/general.dto';
import { hash } from '../utils/hash';

export type UserDocument = User & Document;

@Schema({
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  optimisticConcurrency: true,
  collection: 'users',
})
export class User {
  @Prop({ required: true })
  fullName: string;

  @Prop({ required: false })
  phone?: string;

  @Prop({ required: true, type: String, enum: ADMIN_ROLES })
  userRole: AdminRole;

  @Prop({ required: true })
  jobTitle: string;

  @Prop({ required: true })
  email: string;

  @Prop({
    required: true,
    set: hash,
  })
  password: string;

  created_at: Date;

  updated_at: Date;

  _id: ObjectId;
}

export const UserSchema = SchemaFactory.createForClass(User);

UserSchema.index({ email: 1 }, { unique: true });
