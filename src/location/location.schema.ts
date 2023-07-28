import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, ObjectId } from 'mongoose';
import * as mongoosePaginate from 'mongoose-paginate-v2';
import { GeoPointType } from '../utils/general.dto';

export type LocationDocument = Location & Document;

@Schema(
  {
      _id: false,
      timestamps: false,
  }
)
export class GeoPoint {
    @Prop({ required: true, value: 'Point' })
    type: 'Point';

    @Prop({ required: true, type: [Number, Number] })
    coordinates: [number, number];
}

export const GeoPointSchema = SchemaFactory.createForClass(GeoPoint);

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

    @Prop({
        required: true,
        type: GeoPointSchema,
        set: (point: [number, number]): GeoPointType => {
          return {
              type: 'Point',
              coordinates: point,
          }
        },
        get: (point: GeoPointType): [number, number] => {
            return point.coordinates;
        }
    })
    location: [number, number];

    created_at: Date;

    updated_at: Date;

    _id: ObjectId;
}

export const LocationSchema = SchemaFactory.createForClass(Location);

LocationSchema.index({  location: '2dsphere' });

LocationSchema.plugin(mongoosePaginate);
