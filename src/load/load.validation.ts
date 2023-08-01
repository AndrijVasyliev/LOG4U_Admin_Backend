import * as Joi from 'joi';
import { LangPriorities, TruckTypes } from '../utils/constants';

export const CreateLoadValidation = Joi.object({
    pick: Joi.string().required(),
    pickDate: Joi.date().iso().required(),
    deliver: Joi.string().required(),
    deliverDate: Joi.date().iso().min(Joi.ref('pickDate')).optional(),
    weight: Joi.string().required(),
    truckType: Joi.array().min(1).items(Joi.string().valid(...TruckTypes).required()).required(),
    rate: Joi.number().min(0).optional(),
    // bookedByUser:,
    bookedByCompany: Joi.string().optional(),
    // dispatchers:,
    checkInAs: Joi.string().optional(),
});

export const UpdateLoadValidation = Joi.object({
    pick: Joi.string().optional(),
    pickDate: Joi.date().iso().optional(),
    deliver: Joi.string().optional(),
    deliverDate: Joi.when('pickDate', {
        is: Joi.exist(),
        then: Joi.date().iso().min(Joi.ref('pickDate')),
        otherwise: Joi.date().iso(),
    }).optional(),
    weight: Joi.string().optional(),
    truckType: Joi.array().min(1).items(Joi.string().valid(...TruckTypes).required()).optional(),
    rate: Joi.number().min(0).optional(),
    // bookedByUser:,
    bookedByCompany: Joi.string().optional(),
    // dispatchers:,
    checkInAs: Joi.string().optional(),
});

export const loadQueryParamsSchema = Joi.object({
    offset: Joi.number().integer().min(0).optional(),
    limit: Joi.number().integer().min(1).optional(),
    pick: Joi.string().optional(),
    deliver: Joi.string().optional(),
    weight: Joi.string().optional(),
    truckType: Joi.string().valid(...TruckTypes).optional(),
    rate: Joi.number().min(0).optional(),
    // bookedByUser:,
    bookedByCompany: Joi.string().optional(),
    // dispatchers:,
    checkInAs: Joi.string().optional(),
})
  .keys({
      orderby: Joi.string().valid(
        'pick',
        'pickDate',
        'deliver',
        'deliverDate',
        'weight',
        'rate',
        'bookedByCompany',
        'checkInAs',
      ),
      direction: Joi.string().valid('asc', 'desc'),
  })
  .and('orderby', 'direction');
