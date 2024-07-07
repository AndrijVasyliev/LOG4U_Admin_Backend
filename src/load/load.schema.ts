import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, ObjectId, Schema as MongooseSchema } from 'mongoose';
import {
  DEFAULT_CHECK_IN_AS,
  LOAD_STATUSES,
  TRUCK_TYPES,
  UNITS_OF_LENGTH,
  UNITS_OF_WEIGHT,
} from '../utils/constants';
import {
  LoadStatus,
  TruckType,
  UnitOfLength,
  UnitOfWeight,
} from '../utils/general.dto';
// import { GeoLocationSchema, Location } from '../location/location.schema';
import { User } from '../user/user.schema';
import { Truck } from '../truck/truck.schema';
import { Customer } from '../customer/customer.schema';
import { Facility } from '../facility/facility.schema';
// import { GeoLocationDto } from '../location/location.dto';

export enum TimeFrameType {
  FCFS = 'FCFS',
  APPT = 'APPT',
  ASAP = 'ASAP',
  Direct = 'Direct',
}
export enum StopType {
  PickUp = 'PickUp',
  Delivery = 'Delivery',
}
export type LoadDocument = Load & Document;
// Time Frames: FCFS, APPT, ASAP, Direct
@Schema({
  discriminatorKey: 'type',
  _id: false,
  timestamps: false,
})
export class TimeFramePickUp {
  @Prop({
    required: true,
    immutable: true,
    type: String,
    enum: [TimeFrameType.FCFS, TimeFrameType.APPT, TimeFrameType.ASAP],
  })
  type: TimeFrameType.FCFS | TimeFrameType.APPT | TimeFrameType.ASAP;
}
@Schema({
  discriminatorKey: 'type',
  _id: false,
  timestamps: false,
})
export class TimeFrameDelivery {
  @Prop({
    required: true,
    immutable: true,
    type: String,
    enum: [TimeFrameType.FCFS, TimeFrameType.APPT, TimeFrameType.Direct],
  })
  type: TimeFrameType.FCFS | TimeFrameType.APPT | TimeFrameType.Direct;
}
@Schema({
  _id: false,
  timestamps: false,
})
export class TimeFrameFCFS {
  type = TimeFrameType.FCFS;

  @Prop({
    required: true,
  })
  from: Date;

  @Prop({
    required: true,
  })
  to: Date;
}

@Schema({
  _id: false,
  timestamps: false,
})
export class TimeFrameAPPT {
  type = TimeFrameType.APPT;

  @Prop({
    required: true,
  })
  at: Date;
}
@Schema({
  _id: false,
  timestamps: false,
})
export class TimeFrameASAP {
  type = TimeFrameType.ASAP;

  @Prop({
    required: true,
  })
  at: Date;
}
@Schema({
  _id: false,
  timestamps: false,
})
export class TimeFrameDirect {
  type = TimeFrameType.Direct;

  @Prop({
    required: true,
  })
  at: Date;
}
const TimeFramePickupSchema = SchemaFactory.createForClass(TimeFramePickUp);
const TimeFrameDeliverySchema = SchemaFactory.createForClass(TimeFrameDelivery);
const TimeFrameFCFSSchema = SchemaFactory.createForClass(TimeFrameFCFS);
const TimeFrameAPPTSchema = SchemaFactory.createForClass(TimeFrameAPPT);
const TimeFrameASAPSchema = SchemaFactory.createForClass(TimeFrameASAP);
const TimeFrameDirectSchema = SchemaFactory.createForClass(TimeFrameDirect);
// Freight
@Schema({
  _id: false,
  timestamps: false,
})
export class Freight {
  @Prop({
    required: true,
  })
  pieces: number;

  @Prop({
    required: true,
    type: String,
    enum: UNITS_OF_WEIGHT,
  })
  unitOfWeight: UnitOfWeight;

  @Prop({
    required: true,
  })
  weight: number;

  @Prop({
    required: true,
    type: String,
    enum: UNITS_OF_LENGTH,
  })
  unitOfLength: UnitOfLength;

  @Prop({
    required: true,
  })
  length: number;
}

const FreightSchema = SchemaFactory.createForClass(Freight);
// Stop
@Schema({
  discriminatorKey: 'type',
  _id: false,
  timestamps: false,
})
export class Stop {
  @Prop({
    required: true,
    immutable: true,
    type: String,
    enum: Object.values(StopType),
  })
  type: StopType;

  @Prop({
    required: true,
    type: MongooseSchema.Types.ObjectId,
    ref: 'Facility',
    autopopulate: true,
  })
  facility: Facility;

  @Prop({
    required: false,
  })
  addInfo?: string;
}

@Schema({
  _id: false,
  timestamps: false,
})
export class StopPickUp {
  type = StopType.PickUp;

  @Prop({
    required: true,
    type: TimeFramePickupSchema,
  })
  timeFrame:
    | (TimeFramePickUp & TimeFrameASAP & { type: TimeFrameType.ASAP })
    | (TimeFramePickUp & TimeFrameFCFS & { type: TimeFrameType.FCFS })
    | (TimeFramePickUp & TimeFrameAPPT & { type: TimeFrameType.APPT });

  @Prop({
    required: true,
    type: [FreightSchema],
  })
  freightList: Freight[];
}
@Schema({
  _id: false,
  timestamps: false,
})
export class StopDelivery {
  type = StopType.Delivery;

  @Prop({
    required: true,
    type: TimeFrameDeliverySchema,
  })
  timeFrame:
    | (TimeFrameDelivery & TimeFrameDirect & { type: TimeFrameType.Direct })
    | (TimeFrameDelivery & TimeFrameFCFS & { type: TimeFrameType.FCFS })
    | (TimeFrameDelivery & TimeFrameAPPT & { type: TimeFrameType.APPT });
}
/*export type StopPickUpType = Omit<InstanceType<typeof Stop>, 'type'> &
  InstanceType<typeof StopPickUp> & { type: StopType.PickUp };
export type StopDeliveryType = Omit<InstanceType<typeof Stop>, 'type'> &
  InstanceType<typeof StopDelivery> & { type: StopType.Delivery };
export type StopItemType = StopPickUpType | StopDeliveryType;*/

const StopSchema = SchemaFactory.createForClass(Stop);
const StopPickUpSchema = SchemaFactory.createForClass(StopPickUp);
const timeFramePickUp =
  StopPickUpSchema.path<MongooseSchema.Types.DocumentArray>('timeFrame');
timeFramePickUp.discriminator(TimeFrameType.FCFS, TimeFrameFCFSSchema);
timeFramePickUp.discriminator(TimeFrameType.APPT, TimeFrameAPPTSchema);
timeFramePickUp.discriminator(TimeFrameType.ASAP, TimeFrameASAPSchema);
const StopDeliverySchema = SchemaFactory.createForClass(StopDelivery);
const timeFrameDelivery =
  StopDeliverySchema.path<MongooseSchema.Types.DocumentArray>('timeFrame');
timeFrameDelivery.discriminator(TimeFrameType.FCFS, TimeFrameFCFSSchema);
timeFrameDelivery.discriminator(TimeFrameType.APPT, TimeFrameAPPTSchema);
timeFrameDelivery.discriminator(TimeFrameType.Direct, TimeFrameDirectSchema);
// Main entity
@Schema({
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  optimisticConcurrency: true,
  collection: 'loads',
})
export class Load {
  @Prop({
    required: true,
    immutable: true,
    type: Number,
  })
  loadNumber: number;

  @Prop({
    required: false,
    type: [String],
  })
  ref?: string[];

  @Prop({
    required: true,
    type: String,
    enum: LOAD_STATUSES,
  })
  status: LoadStatus;

  @Prop({
    required: true,
    type: [StopSchema],
    autopopulate: true,
  })
  stops: (
    | (Stop & StopPickUp & { type: StopType.PickUp })
    | (Stop & StopDelivery & { type: StopType.Delivery })
  )[];

  @Prop({
    required: false,
    type: Number,
  })
  stopsVer?: number;

  @Prop({
    required: false,
    type: Number,
  })
  miles?: number;

  @Prop({ required: true })
  weight: string;

  @Prop({
    required: true,
    type: [{ required: true, type: String, enum: TRUCK_TYPES }],
    validate: (array: any[]) => {
      return array && array.length > 0;
    },
  })
  truckType: TruckType[];

  @Prop({ required: false })
  rate?: number;

  @Prop({ required: true })
  totalCharges: number;

  @Prop({ required: true })
  currency: string;

  @Prop({
    required: true,
    type: MongooseSchema.Types.ObjectId,
    ref: 'User',
    autopopulate: true,
  })
  bookedByUser: User;

  @Prop({ required: false })
  bookedByCompany?: string;

  @Prop({
    required: true,
    type: [MongooseSchema.Types.ObjectId],
    ref: 'User',
    autopopulate: true,
  })
  assignTo: User[];

  @Prop({ required: false, default: DEFAULT_CHECK_IN_AS })
  checkInAs?: string;

  @Prop({
    required: false,
    type: MongooseSchema.Types.ObjectId,
    ref: 'Truck',
    autopopulate: true,
  })
  truck?: Truck;

  @Prop({
    required: true,
    type: MongooseSchema.Types.ObjectId,
    ref: 'Customer',
    autopopulate: true,
  })
  bookedWith: Customer;

  created_at: Date;

  updated_at: Date;

  _id: ObjectId;
}

export const LoadSchema = SchemaFactory.createForClass(Load);
const stopsArray = LoadSchema.path<MongooseSchema.Types.DocumentArray>('stops');
stopsArray.discriminator(StopType.PickUp, StopPickUpSchema);
stopsArray.discriminator(StopType.Delivery, StopDeliverySchema);

LoadSchema.index({ loadNumber: 1 }, { unique: true });
LoadSchema.index(
  { truck: 1, state: 1 },
  {
    unique: true,
    hidden: true,
    partialFilterExpression: { status: { $eq: 'In Progress' } },
  },
);
