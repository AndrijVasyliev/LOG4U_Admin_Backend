import * as Joi from 'joi';
import { TruckTypes } from '../utils/constants';
import { MongoObjectIdValidation } from '../utils/idValidate.pipe';

export const CreateLoadValidation = Joi.object({
  pick: MongoObjectIdValidation.required(),
  pickDate: Joi.date().iso().required(),
  deliver: MongoObjectIdValidation.required(),
  deliverDate: Joi.date().iso().min(Joi.ref('pickDate')).optional(),
  weight: Joi.string().required(),
  truckType: Joi.array()
    .min(1)
    .items(
      Joi.string()
        .valid(...TruckTypes)
        .required(),
    )
    .required(),
  rate: Joi.number().min(0).optional(),
  bookedByUser: MongoObjectIdValidation.required(),
  bookedByCompany: Joi.string().optional(),
  dispatchers: Joi.array().items(MongoObjectIdValidation.required()).optional(),
  checkInAs: Joi.string().optional(),
});

export const UpdateLoadValidation = Joi.object({
  pick: MongoObjectIdValidation.optional(),
  pickDate: Joi.date().iso().optional(),
  deliver: MongoObjectIdValidation.optional(),
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
        .valid(...TruckTypes)
        .required(),
    )
    .optional(),
  rate: Joi.number().min(0).optional(),
  bookedByUser: MongoObjectIdValidation.optional(),
  bookedByCompany: Joi.string().optional(),
  dispatchers: Joi.array().items(MongoObjectIdValidation.required()).optional(),
  checkInAs: Joi.string().optional(),
});

export const loadQueryParamsSchema = Joi.object({
  offset: Joi.number().integer().min(0).optional(),
  limit: Joi.number().integer().min(1).optional(),
  loadNumber: Joi.number().min(0).optional(),
  weight: Joi.string().optional(),
  truckType: Joi.string()
    .valid(...TruckTypes)
    .optional(),
  rate: Joi.number().min(0).optional(),
  bookedByCompany: Joi.string().optional(),
  checkInAs: Joi.string().optional(),
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
