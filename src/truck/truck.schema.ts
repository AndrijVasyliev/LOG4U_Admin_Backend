import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, ObjectId, Schema as MongooseSchema } from 'mongoose';
import {
  COORDINATOR_TYPES,
  DRIVER_TYPES,
  OWNER_TYPES,
  TRUCK_CERTIFICATES,
  TRUCK_CROSSBORDERS,
  TRUCK_EQUIPMENTS,
  TRUCK_STATUSES,
  TRUCK_TYPES,
} from '../utils/constants';
import {
  GeoPointType,
  TruckCertificate,
  TruckCrossborder,
  TruckEquipment,
  TruckStatus,
  TruckType,
} from '../utils/general.dto';
import { GeoPointSchema, Location } from '../location/location.schema';
import { Owner } from '../owner/owner.schema';
import { Coordinator } from '../coordinator/coordinator.schema';
import { Driver } from '../driver/driver.schema';
import { User } from '../user/user.schema';

export type TruckDocument = Truck & Document;

@Schema({
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  optimisticConcurrency: true,
  collection: 'trucks',
})
export class Truck {
  @Prop({ required: true })
  truckNumber: number;

  @Prop({ required: true, type: String, enum: TRUCK_STATUSES })
  status: TruckStatus;

  @Prop({
    required: false,
    type: GeoPointSchema,
    set: (point?: [number, number]): GeoPointType | void => {
      if (!point) {
        return;
      }
      return {
        type: 'Point',
        coordinates: [point[1], point[0]],
      };
    },
    get: (point?: GeoPointType): [number, number] | void => {
      if (!point) {
        return;
      }
      return [point.coordinates[1], point.coordinates[0]];
    },
  })
  lastLocation?: [number, number];

  @Prop({
    required: false,
    type: MongooseSchema.Types.ObjectId,
    ref: 'Location',
    autopopulate: true,
  })
  lastCity?: Location;

  @Prop({ required: false })
  locationUpdatedAt: Date;

  @Prop({ required: true, type: String, enum: TRUCK_CROSSBORDERS })
  crossborder: TruckCrossborder;

  @Prop({ required: false, type: String, enum: TRUCK_CERTIFICATES })
  certificate?: TruckCertificate;

  @Prop({ required: true, type: String, enum: TRUCK_TYPES })
  type: TruckType;

  @Prop({
    required: false,
    type: [{ required: false, type: String, enum: TRUCK_EQUIPMENTS }],
  })
  equipment?: TruckEquipment[];

  @Prop({ required: true })
  payload: number;

  @Prop({ required: true })
  grossWeight: string;

  @Prop({ required: true })
  make: string;

  @Prop({ required: true })
  model: string;

  @Prop({ required: true })
  year: number;

  @Prop({ required: true })
  color: string;

  @Prop({ required: true })
  vinCode: string;

  @Prop({ required: true })
  licencePlate: string;

  @Prop({ required: true })
  insideDims: string;

  @Prop({ required: true })
  doorDims: string;

  @Prop({
    required: true,
    type: MongooseSchema.Types.ObjectId,
    ref: 'Owner',
    autopopulate: { match: { type: { $in: OWNER_TYPES } } },
  })
  owner: Owner;

  @Prop({
    required: false,
    type: MongooseSchema.Types.ObjectId,
    ref: 'Coordinator',
    autopopulate: { match: { type: { $in: COORDINATOR_TYPES } } },
  })
  coordinator?: Coordinator;

  @Prop({
    required: false,
    type: MongooseSchema.Types.ObjectId,
    ref: 'Driver',
    autopopulate: { match: { type: { $in: DRIVER_TYPES } } },
  })
  driver?: Driver;

  @Prop({ required: false })
  reservedAt: Date;

  @Prop({
    required: false,
    type: MongooseSchema.Types.ObjectId,
    ref: 'User',
    autopopulate: true,
  })
  reservedBy?: User;

  created_at: Date;

  updated_at: Date;

  _id: ObjectId;
}

export const TruckSchema = SchemaFactory.createForClass(Truck);

TruckSchema.index({ truckNumber: 1 }, { unique: true });
TruckSchema.index({ driver: 1 }, { unique: true, sparse: true });
TruckSchema.index({ lastLocation: '2dsphere' });
