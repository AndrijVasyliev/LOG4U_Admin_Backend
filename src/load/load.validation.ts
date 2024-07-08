import * as Joi from 'joi';
import { StopType, TimeFrameType } from './load.schema';
import {
  LOAD_STATUSES,
  TRUCK_TYPES,
  UNITS_OF_LENGTH,
  UNITS_OF_WEIGHT,
} from '../utils/constants';
import { MongoObjectIdValidation } from '../utils/idValidate.pipe';

const TimeFrameFCFSValidation = Joi.object({
  type: Joi.string().valid(TimeFrameType.FCFS).required(),
  from: Joi.date().iso().required(),
  to: Joi.date().iso().min(Joi.ref('from')).required(),
});
const TimeFrameAPPTValidation = Joi.object({
  type: Joi.string().valid(TimeFrameType.APPT).required(),
  at: Joi.date().iso().required(),
});
const TimeFrameASAPValidation = Joi.object({
  type: Joi.string().valid(TimeFrameType.ASAP).required(),
  at: Joi.date().iso().required(),
});
const TimeFrameDirectValidation = Joi.object({
  type: Joi.string().valid(TimeFrameType.Direct).required(),
  at: Joi.date().iso().required(),
});

const FreightValidation = Joi.object({
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

const StopValidation = Joi.object({
  stopId: Joi.string().optional(),
  facility: MongoObjectIdValidation.required(),
  addInfo: Joi.string().allow('').optional(),
});

const StopPickUpValidation = StopValidation.append({
  type: Joi.string().valid(StopType.PickUp).required(),
  timeFrame: Joi.alternatives(
    TimeFrameFCFSValidation,
    TimeFrameAPPTValidation,
    TimeFrameASAPValidation,
  ).required(),
  freightList: Joi.array().items(FreightValidation).min(1).required(),
});
const StopDeliveryValidation = StopValidation.append({
  type: Joi.string().valid(StopType.Delivery).required(),
  timeFrame: Joi.alternatives(
    TimeFrameFCFSValidation,
    TimeFrameAPPTValidation,
    TimeFrameDirectValidation,
  ).required(),
});

export const CreateLoadValidation = Joi.object({
  ref: Joi.array().items(Joi.string().required()).min(1).max(3).optional(),
  status: Joi.string()
    .valid(...LOAD_STATUSES)
    .required(),
  stops: Joi.array()
    .ordered(StopPickUpValidation.required())
    .items(StopPickUpValidation, StopDeliveryValidation.required())
    .custom((value: object[]) => {
      const lastItem = value[value.length - 1];
      const validationResult = StopDeliveryValidation.validate(lastItem);
      if (validationResult.error) {
        throw validationResult.error;
      }
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
  bookedByUser: MongoObjectIdValidation.required(),
  bookedByCompany: Joi.string().allow('').optional(),
  assignTo: Joi.array().items(MongoObjectIdValidation).min(1).required(),
  checkInAs: Joi.string().allow('').optional(),
  truck: Joi.alternatives(null, MongoObjectIdValidation).optional(),
  bookedWith: MongoObjectIdValidation.required(),
});

export const UpdateLoadValidation = Joi.object({
  ref: Joi.array().items(Joi.string().required()).min(1).max(3).optional(),
  status: Joi.string()
    .valid(...LOAD_STATUSES)
    .optional(),
  stops: Joi.array()
    .ordered(StopPickUpValidation.required())
    .items(StopPickUpValidation, StopDeliveryValidation.required())
    .optional(),
  weight: Joi.string().optional(),
  truckType: Joi.array()
    .min(1)
    .items(
      Joi.string()
        .valid(...TRUCK_TYPES)
        .required(),
    )
    .optional(),
  rate: Joi.number().min(0).optional(),
  totalCharges: Joi.number().min(0).optional(),
  currency: Joi.string().optional(),
  bookedByUser: Joi.alternatives(null, MongoObjectIdValidation).optional(),
  bookedByCompany: Joi.string().allow('').optional(),
  assignTo: Joi.array().items(MongoObjectIdValidation).min(1).optional(),
  checkInAs: Joi.string().allow('').optional(),
  truck: Joi.alternatives(null, MongoObjectIdValidation).optional(),
  bookedWith: Joi.alternatives(null, MongoObjectIdValidation).optional(),
});

export const LoadQueryParamsSchema = Joi.object({
  offset: Joi.number().integer().min(0).optional(),
  limit: Joi.number().integer().min(1).optional(),
  loadNumber: Joi.number().min(0).optional(),
  status: Joi.string()
    .valid(...LOAD_STATUSES)
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
      /*'pickDate',
      'deliverDate',*/
      'weight',
      'rate',
      'totalCharges',
      'currency',
      'bookedByCompany',
      'checkInAs',
    ),
    direction: Joi.string().valid('asc', 'desc'),
  })
  .and('orderby', 'direction');
