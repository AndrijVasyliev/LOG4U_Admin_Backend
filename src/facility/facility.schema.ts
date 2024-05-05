import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, ObjectId } from 'mongoose';
import { GeoPointType, MongoGeoPointType } from '../utils/general.dto';
import { GeoPointSchema } from '../location/location.schema';

export type FacilityDocument = Facility & Document;

@Schema({
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  optimisticConcurrency: true,
  collection: 'facilities',
})
export class Facility {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  address: string;

  @Prop({ required: false })
  address2?: string;

  @Prop({
    required: true,
    type: GeoPointSchema,
    set: (point?: GeoPointType): MongoGeoPointType | void => {
      if (!point) {
        return;
      }
      return {
        type: 'Point',
        coordinates: [point[1], point[0]],
      };
    },
    get: (point?: MongoGeoPointType): GeoPointType | void => {
      if (!point) {
        return;
      }
      return [point.coordinates[1], point.coordinates[0]];
    },
  })
  facilityLocation: GeoPointType;

  created_at: Date;

  updated_at: Date;

  _id: ObjectId;
}

export const FacilitySchema = SchemaFactory.createForClass(Facility);

FacilitySchema.index({ name: 1 }, { unique: true });
FacilitySchema.index({ facilityLocation: '2dsphere' });
