import * as Joi from 'joi';
import { StopType, TimeFrameType } from './load.schema';
import { Stops } from './load.dto';
import {
  LOAD_STATUSES,
  STOP_DELIVERY_STATUSES,
  STOP_PICKUP_STATUSES,
  ORDER_VALUES,
  TRUCK_TYPES,
  UNITS_OF_LENGTH,
  UNITS_OF_WEIGHT,
} from '../utils/constants';
import { MongoObjectIdValidationSchema } from '../utils/idValidate.pipe';

const TimeFrameFCFSValidationSchema = Joi.object({
  type: Joi.string().valid(TimeFrameType.FCFS).required(),
  from: Joi.date().iso().required(),
  to: Joi.date().iso().min(Joi.ref('from')).required(),
});
const TimeFrameAPPTValidationSchema = Joi.object({
  type: Joi.string().valid(TimeFrameType.APPT).required(),
  at: Joi.date().iso().required(),
});
const TimeFrameASAPValidationSchema = Joi.object({
  type: Joi.string().valid(TimeFrameType.ASAP).required(),
  at: Joi.date().iso().required(),
});
const TimeFrameDirectValidationSchema = Joi.object({
  type: Joi.string().valid(TimeFrameType.Direct).required(),
  at: Joi.date().iso().required(),
});

const FreightValidationSchema = Joi.object({
  freightId: Joi.string().required(),
  pieces: Joi.number().integer().min(1).required(),
  unitOfWeight: Joi.string()
    .valid(...UNITS_OF_WEIGHT)
    .required(),
  weight: Joi.number().greater(0).required(),
  unitOfLength: Joi.string()
    .valid(...UNITS_OF_LENGTH)
    .required(),
  length: Joi.number().greater(0).required(),
});

export const StopPickUpDriversInfoValidationSchema = Joi.object({
  driversInfoId: Joi.string().optional(),
  pieces: Joi.number().integer().min(1).required(),
  unitOfWeight: Joi.string()
    .valid(...UNITS_OF_WEIGHT)
    .required(),
  weight: Joi.number().greater(0).required(),
  bol: MongoObjectIdValidationSchema.required(),
  seal: Joi.string().required(),
  addressIsCorrect: Joi.boolean().required(),
});

export const StopDeliveryDriversInfoValidationSchema = Joi.object({
  driversInfoId: Joi.string().optional(),
  bol: MongoObjectIdValidationSchema.required(),
  signedBy: Joi.string().required(),
});

const StopValidationSchema = Joi.object({
  stopId: Joi.string().optional(),
  facility: MongoObjectIdValidationSchema.required(),
  addInfo: Joi.string().allow('').optional(),
});

const StopPickUpValidationSchema = StopValidationSchema.append({
  type: Joi.string().valid(StopType.PickUp).required(),
  driversInfo: Joi.array().items(StopPickUpDriversInfoValidationSchema).optional(),
  status: Joi.string()
    .valid(...STOP_PICKUP_STATUSES)
    .optional(),
  timeFrame: Joi.alternatives(
    TimeFrameFCFSValidationSchema,
    TimeFrameAPPTValidationSchema,
    TimeFrameASAPValidationSchema,
  ).required(),
  freightList: Joi.array().items(FreightValidationSchema).min(1).required(),
});
const StopDeliveryValidationSchema = StopValidationSchema.append({
  type: Joi.string().valid(StopType.Delivery).required(),
  driversInfo: Joi.array().items(StopDeliveryDriversInfoValidationSchema).optional(),
  status: Joi.string()
    .valid(...STOP_DELIVERY_STATUSES)
    .optional(),
  timeFrame: Joi.alternatives(
    TimeFrameFCFSValidationSchema,
    TimeFrameAPPTValidationSchema,
    TimeFrameDirectValidationSchema,
  ).required(),
  bolList: Joi.array()
    .items(MongoObjectIdValidationSchema.required())
    .min(1)
    .required(),
});

export const CreateLoadValidationSchema = Joi.object({
  ref: Joi.array().items(Joi.string().required()).min(1).max(3).required(),
  status: Joi.string()
    .valid(...LOAD_STATUSES)
    .required(),
  stops: Joi.array()
    //.ordered(StopPickUpValidationSchema.required())
    .min(2)
    .items(StopPickUpValidationSchema, StopDeliveryValidationSchema.required())
    .messages({
      'custom.stopFirstPickUp':
        'First stop must be PickUp',
      'custom.stopLastDelivery':
        'Last stop must be Delivery',
    })
    .custom((value: Stops, helper) => {
      const firstItem = value[0];
      const lastItem = value[value.length - 1];
      if (firstItem.type !== 'PickUp') {
        return helper.error('custom.stopFirstPickUp');
      }
      if (lastItem.type !== 'Delivery') {
        return helper.error('custom.stopLastDelivery');
      }
      return value;
    })
    .messages({
      'custom.stopStatusDouble':
        'More then one stop in not New or Completed status',
      'custom.stopStatusOrder': 'Wrong order of stop status',
      'custom.stopStatusOnlyNew':
        'If first stop status is New, all stops statuses must be New',
      'custom.stopStatusConsistent':
        'If first stop have status is New, all stops statuses must be New',
    })
    .custom((value: Stops, helper) => {
      if (value[0]) {
        const stopsWithEmptyStatus = value.reduce(
          (acc, stop) => (!stop.status ? acc + 1 : acc),
          0,
        );
        if (stopsWithEmptyStatus > 0 && stopsWithEmptyStatus !== value.length) {
          return helper.error('custom.stopStatusConsistent');
        } else if (stopsWithEmptyStatus === value.length) {
          return value;
        }
      }
      if (value[0] && value[0].status === 'New') {
        if (value.find((stop) => stop.status !== 'New')) {
          return helper.error('custom.stopStatusOnlyNew');
        }
      } else {
        let completedPassed = false;
        let newStarted = false;
        let countNotFinalState = 0;
        for (let index = 0; index < value.length; index++) {
          if (
            index > 0 &&
            !completedPassed &&
            value[index - 1].status !== 'Completed'
          ) {
            return helper.error('custom.stopStatusOrder');
          }
          value[index].status &&
            value[index].status !== 'Completed' &&
            !completedPassed &&
            (completedPassed = true);
          value[index].status &&
            value[index].status === 'New' &&
            !newStarted &&
            (newStarted = true);
          value[index].status &&
            value[index].status !== 'New' &&
            value[index].status !== 'Completed' &&
            countNotFinalState++;
          if (
            index < value.length - 1 &&
            newStarted &&
            value[index + 1].status !== 'New'
          ) {
            return helper.error('custom.stopStatusOrder');
          }
        }
        if (countNotFinalState > 1) {
          return helper.error('custom.stopStatusDouble');
        }
      }
      return value;
    })
    .custom((value: Stops) => {
      const freightIdList = value
        ?.filter((stop) => stop.type === StopType.PickUp)
        .flatMap((stop, stopIndex: number) =>
          stop.freightList.map((freight) => freight.freightId),
        );
      value.forEach((stop) => {
        if (stop.type === StopType.PickUp) {
          stop.driversInfo = stop?.driversInfo?.filter((driversInfoItem) =>
            !!freightIdList?.find((freightId) => freightId.toString() === driversInfoItem.bol.toString()),
          );
        }
        if (stop.type === StopType.Delivery) {
          stop.driversInfo = stop?.driversInfo?.filter((driversInfoItem) =>
            !!freightIdList?.find((freightId) => freightId.toString() === driversInfoItem.bol.toString()),
          );
          stop.bolList = stop?.bolList?.filter((bolItemId) =>
            !!freightIdList?.find((freightId) => freightId.toString() === bolItemId.toString()),
          );
        }
      });
      return value;
    })
    .required(),
  weight: Joi.string().required(),
  truckType: Joi.array()
    .min(1)
    .items(
      Joi.string()
        .valid(...TRUCK_TYPES)
        .required(),
    )
    .required(),
  rate: Joi.number().min(0).optional(),
  totalCharges: Joi.number().min(0).required(),
  currency: Joi.string().required(),
  bookedByUser: MongoObjectIdValidationSchema.required(),
  bookedByCompany: Joi.string().allow('').optional(),
  assignTo: Joi.array().items(MongoObjectIdValidationSchema).min(1).required(),
  checkInAs: Joi.string().allow('').optional(),
  truck: Joi.alternatives(null, MongoObjectIdValidationSchema).optional(),
  bookedWith: MongoObjectIdValidationSchema.required(),
});

export const UpdateLoadValidationSchema = CreateLoadValidationSchema.fork(
  Object.keys(CreateLoadValidationSchema.describe().keys),
  (schema) => schema.optional(),
);

export const LoadQueryParamsSchema = Joi.object({
  offset: Joi.number().integer().min(0).optional(),
  limit: Joi.number().integer().min(1).optional(),
  ref: Joi.string().optional(),
  loadNumber: Joi.number().min(0).optional(),
  status: Joi.alternatives(
    Joi.string()
      .valid(...LOAD_STATUSES)
      .required(),
    Joi.array()
      .items(
        Joi.string()
          .valid(...LOAD_STATUSES)
          .required(),
      )
      .min(1)
      .required(),
  )
    .custom((value: string | string[]) => {
      if (Array.isArray(value)) {
        return value;
      }
      return value.split(',');
    })
    .optional(),
  weight: Joi.string().optional(),
  truckType: Joi.string()
    .valid(...TRUCK_TYPES)
    .optional(),
  rate: Joi.number().min(0).optional(),
  totalCharges: Joi.number().min(0).optional(),
  currency: Joi.string().optional(),
  bookedByCompany: Joi.string().optional(),
  checkInAs: Joi.string().optional(),
  truckNumber: Joi.number().optional(),
})
  .keys({
    orderby: Joi.string().valid(
      'loadNumber',
      'status',
      'weight',
      'rate',
      'totalCharges',
      'currency',
      'bookedByCompany',
      'checkInAs',
    ),
    direction: Joi.string().valid(...ORDER_VALUES),
  })
  .and('orderby', 'direction');
