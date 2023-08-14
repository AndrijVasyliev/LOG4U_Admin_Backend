import * as Joi from 'joi';
import { EARTH_RADIUS_MILES } from '../utils/constants';

export const CreateLocationValidation = Joi.object({
  zipCode: Joi.string().required(),
  name: Joi.string().required(),
  stateCode: Joi.string().required(),
  stateName: Joi.string().required(),
  location: Joi.array()
    .min(2)
    .max(2)
    .items(
      Joi.number().min(-90).max(90).required(),
      Joi.number().min(-180).max(180).required(),
    )
    .required(),
});

export const UpdateLocationValidation = Joi.object({
  zipCode: Joi.string().optional(),
  name: Joi.string().optional(),
  stateCode: Joi.string().optional(),
  stateName: Joi.string().optional(),
  location: Joi.array()
    .min(2)
    .max(2)
    .items(
      Joi.number().min(-90).max(90).required(),
      Joi.number().min(-180).max(180).required(),
    ),
});

export const LocationQueryParamsSchema = Joi.object({
  offset: Joi.number().integer().min(0).optional(),
  limit: Joi.number().integer().min(1).optional(),
  search: Joi.string().optional(),
  searchState: Joi.string().optional(),
  zipCode: Joi.string().optional(),
  name: Joi.string().optional(),
  stateCode: Joi.string().optional(),
  stateName: Joi.string().optional(),
})
  .keys({
    orderby: Joi.string().valid('zipCode', 'name', 'stateCode', 'stateName'),
    direction: Joi.string().valid('asc', 'desc'),
  })
  .and('orderby', 'direction')
  .keys({
    location: Joi.string()
      .regex(/^-?\d+\.?\d*,-?\d+\.?\d*$/)
      .messages({
        'custom.long': 'Longitude must be between -180 and 180',
        'custom.lat': 'Latitude must be between -90 and 90',
      })
      .custom((value: string, helper) => {
        const parsed = value.split(',');
        const lat = +parsed[0];
        const long = +parsed[1];
        if (-180 > long || 180 < long) {
          return helper.error('custom.long');
        }
        if (-90 > lat || 90 < lat) {
          return helper.error('custom.lat');
        }
        return [long, lat];
      }),
    distance: Joi.number().min(0).max(EARTH_RADIUS_MILES),
  })
  .and('location', 'distance');
