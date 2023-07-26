import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, ObjectId } from 'mongoose';
import * as mongoosePaginate from 'mongoose-paginate-v2';

export type LocationDocument = Location & Document;

@Schema({
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
    optimisticConcurrency: true,
    collection: 'locations',
})
export class Location {
    @Prop({ required: true })
    zipCode: string;

    @Prop({ required: true })
    name: string;

    @Prop({ required: true })
    stateCode: string;

    @Prop({ required: true })
    stateName: string;

    created_at: Date;

    updated_at: Date;

    _id: ObjectId;
}

export const LocationSchema = SchemaFactory.createForClass(Location);

// LocationSchema.index({ fullName: 1, hiredBy: 1 }, { unique: true });

LocationSchema.plugin(mongoosePaginate);
