import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, ObjectId } from 'mongoose';
import * as mongoosePaginate from 'mongoose-paginate-v2';
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

    @Prop({ required: true })
    password: string;

    created_at: Date;

    updated_at: Date;

    _id: ObjectId;
}

export const UserSchema = SchemaFactory.createForClass(User);

// UserSchema.index({ fullName: 1, hiredBy: 1 }, { unique: true });

UserSchema.plugin(mongoosePaginate);
