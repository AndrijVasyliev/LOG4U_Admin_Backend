import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, ObjectId, Schema as MongooseSchema } from 'mongoose';
import {
  GeoCode,
  AddressLocation,
  GeometryLocationDto,
  LatLng,
} from './location.dto';
import { GeoPointType } from '../utils/general.dto';

export type LocationDocument = Location & Document;

@Schema({
  _id: false,
  timestamps: false,
})
export class GeoPoint {
  @Prop({ required: true, value: 'Point' })
  type: 'Point';

  @Prop({ required: true, type: [Number, Number] })
  coordinates: [number, number];
}

export const GeoPointSchema = SchemaFactory.createForClass(GeoPoint);

@Schema({
  _id: false,
  timestamps: false,
})
export class GeometryLocation {
  @Prop({
    required: true,
    type: GeoPointSchema,
    set: (point: LatLng): GeoPointType => {
      return {
        type: 'Point',
        coordinates: [point.lng, point.lat],
      };
    },
    get: (point: GeoPointType): LatLng => {
      return { lat: point.coordinates[1], lng: point.coordinates[0] };
    },
  })
  location: LatLng;

  @Prop({ required: false })
  location_type?: string;

  @Prop({ required: false, type: MongooseSchema.Types.Mixed })
  viewport?: object;

  @Prop({ required: false, type: MongooseSchema.Types.Mixed })
  bounds?: object;
}

export const GeometryLocationSchema =
  SchemaFactory.createForClass(GeometryLocation);

GeometryLocationSchema.index({ location: '2dsphere' });

@Schema({
  _id: false,
  timestamps: false,
})
export class GeoLocation {
  @Prop({ required: false })
  types?: string[];

  @Prop({ required: true })
  formatted_address: string;

  @Prop({ required: false })
  address_components?: AddressLocation[];

  @Prop({ required: false })
  partial_match?: boolean;

  @Prop({ required: false })
  place_id?: string;

  @Prop({ required: false })
  plus_code?: GeoCode;

  @Prop({ required: false })
  postcode_localities?: string[];

  @Prop({
    required: true,
    type: GeometryLocationSchema,
  })
  geometry: GeometryLocationDto;
}

export const GeoLocationSchema = SchemaFactory.createForClass(GeoLocation);

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
        coordinates: [point[1], point[0]],
      };
    },
    get: (point: GeoPointType): [number, number] => {
      return [point.coordinates[1], point.coordinates[0]];
    },
  })
  location: [number, number];

  created_at: Date;

  updated_at: Date;

  _id: ObjectId;
}

export const LocationSchema = SchemaFactory.createForClass(Location);

LocationSchema.index({ zipCode: 1 }, { unique: true });
LocationSchema.index({ location: '2dsphere' });
