import * as Joi from 'joi';
import {
  DistanceQueryParamValidation,
  GeoPointBodyValidation,
  GeoPointQueryParamValidation,
} from '../location/location.validation';

export const CreateFacilityValidation = Joi.object({
  name: Joi.string().required(),
  address1: Joi.string().required(),
  address2: Joi.string().allow('').optional(),
  facilityLocation: GeoPointBodyValidation.required(),
});

export const UpdateFacilityValidation = Joi.object({
  name: Joi.string().optional(),
  address1: Joi.string().optional(),
  address2: Joi.string().allow('').optional(),
  facilityLocation: GeoPointBodyValidation.optional(),
});

export const FacilityQueryParamsSchema = Joi.object({
  offset: Joi.number().integer().min(0).optional(),
  limit: Joi.number().integer().min(1).optional(),
  name: Joi.string().optional(),
  address1: Joi.string().optional(),
  address2: Joi.string().optional(),
})
  .keys({
    orderby: Joi.string().valid('name'),
    direction: Joi.string().valid('asc', 'desc'),
  })
  .and('orderby', 'direction')
  .keys({
    facilityLocation: GeoPointQueryParamValidation,
    distance: DistanceQueryParamValidation,
  })
  .and('facilityLocation', 'distance');
