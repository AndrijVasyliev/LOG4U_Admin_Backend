import * as Joi from 'joi';
import { TRUCK_TYPES } from '../utils/constants';
import { MongoObjectIdValidation } from '../utils/idValidate.pipe';
import { GeoLocation } from '../location/location.validation';

export const CreateLoadValidation = Joi.object({
  pick: GeoLocation.required(),
  pickDate: Joi.date().iso().required(),
  deliver: GeoLocation.required(),
  deliverDate: Joi.date().iso().min(Joi.ref('pickDate')).required(),
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
  bookedByUser: Joi.alternatives(null, MongoObjectIdValidation).optional(),
  bookedByCompany: Joi.string().allow('').optional(),
  dispatchers: Joi.array().items(MongoObjectIdValidation.optional()).optional(),
  checkInAs: Joi.string().allow('').optional(),
  truck: Joi.alternatives(null, MongoObjectIdValidation).optional(),
});

export const UpdateLoadValidation = Joi.object({
  pick: GeoLocation.optional(),
  pickDate: Joi.date().iso().optional(),
  deliver: GeoLocation.optional(),
  deliverDate: Joi.when('pickDate', {
    is: Joi.exist(),
    then: Joi.date().iso().min(Joi.ref('pickDate')),
    otherwise: Joi.date().iso(),
  }).optional(),
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
  bookedByUser: Joi.alternatives(null, MongoObjectIdValidation).optional(),
  bookedByCompany: Joi.string().allow('').optional(),
  dispatchers: Joi.array().items(MongoObjectIdValidation.optional()).optional(),
  checkInAs: Joi.string().allow('').optional(),
  truck: Joi.alternatives(null, MongoObjectIdValidation).optional(),
});

export const LoadQueryParamsSchema = Joi.object({
  offset: Joi.number().integer().min(0).optional(),
  limit: Joi.number().integer().min(1).optional(),
  loadNumber: Joi.number().min(0).optional(),
  weight: Joi.string().optional(),
  truckType: Joi.string()
    .valid(...TRUCK_TYPES)
    .optional(),
  rate: Joi.number().min(0).optional(),
  bookedByCompany: Joi.string().optional(),
  checkInAs: Joi.string().optional(),
  truckNumber: Joi.number().optional(),
})
  .keys({
    orderby: Joi.string().valid(
      'loadNumber',
      'pickDate',
      'deliverDate',
      'weight',
      'rate',
      'bookedByCompany',
      'checkInAs',
    ),
    direction: Joi.string().valid('asc', 'desc'),
  })
  .and('orderby', 'direction');
