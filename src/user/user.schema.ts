import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import * as crypto from 'node:crypto';
import { Document, ObjectId } from 'mongoose';
import { UserRoles } from '../utils/constants';
import { UserRole } from '../utils/general.dto';

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

  @Prop({ required: true, enum: UserRoles })
  userRole: UserRole;

  @Prop({ required: true })
  jobTitle: string;

  @Prop({ required: true })
  email: string;

  @Prop({
    required: true,
    set: (password: string): string => {
      const hash = crypto.createHash('sha256');
      hash.update(password);
      return hash.digest('hex');
    },
  })
  password: string;

  created_at: Date;

  updated_at: Date;

  _id: ObjectId;
}

export const UserSchema = SchemaFactory.createForClass(User);
