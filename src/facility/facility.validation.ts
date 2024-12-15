import * as Joi from 'joi';
import {
  DistanceQueryParamValidationSchema,
  GeoPointBodyValidationSchema,
  GeoPointQueryParamValidationSchema,
} from '../location/location.validation';
import { ORDER_VALUES } from '../utils/constants';

export const CreateFacilityValidationSchema = Joi.object({
  name: Joi.string().required(),
  address: Joi.string().required(),
  address2: Joi.string().allow('').optional(),
  facilityLocation: GeoPointBodyValidationSchema.required(),
});

export const UpdateFacilityValidationSchema =
  CreateFacilityValidationSchema.fork(
    Object.keys(CreateFacilityValidationSchema.describe().keys),
    (schema) => schema.optional(),
  );

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
    facilityLocation: GeoPointQueryParamValidationSchema,
    distance: DistanceQueryParamValidationSchema,
  })
  .and('facilityLocation', 'distance');
