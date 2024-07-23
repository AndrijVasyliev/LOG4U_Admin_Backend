import * as Joi from 'joi';
import {
  DistanceQueryParamValidation,
  GeoPointBodyValidation,
  GeoPointQueryParamValidation,
} from '../location/location.validation';
import { ORDER_VALUES } from '../utils/constants';

export const CreateFacilityValidation = Joi.object({
  name: Joi.string().required(),
  address: Joi.string().required(),
  address2: Joi.string().allow('').optional(),
  facilityLocation: GeoPointBodyValidation.required(),
});

export const UpdateFacilityValidation = Joi.object({
  name: Joi.string().optional(),
  address: Joi.string().optional(),
  address2: Joi.string().allow('').optional(),
  facilityLocation: GeoPointBodyValidation.optional(),
});

export const FacilityQueryParamsSchema = Joi.object({
  offset: Joi.number().integer().min(0).optional(),
  limit: Joi.number().integer().min(1).optional(),
  search: Joi.string().optional(),
  name: Joi.string().optional(),
  address: Joi.string().optional(),
  address2: Joi.string().optional(),
})
  .keys({
    orderby: Joi.string().valid('name'),
    direction: Joi.string().valid(...ORDER_VALUES),
  })
  .and('orderby', 'direction')
  .keys({
    facilityLocation: GeoPointQueryParamValidation,
    distance: DistanceQueryParamValidation,
  })
  .and('facilityLocation', 'distance');
