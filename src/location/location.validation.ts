import * as Joi from 'joi';
import { EARTH_RADIUS_MILES, ORDER_VALUES } from '../utils/constants';

export const GeoPointQueryParamValidationSchema = Joi.string()
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
    return [lat, long];
  });

export const DistanceQueryParamValidationSchema = Joi.number()
  .min(0)
  .max(EARTH_RADIUS_MILES);

export const LatitudeValidationSchema = Joi.number().min(-90).max(90).required();
export const LongitudeValidationSchema = Joi.number().min(-180).max(180).required();
export const GeoPointBodyValidationSchema = Joi.array()
  .min(2)
  .max(2)
  .items(LatitudeValidationSchema, LongitudeValidationSchema);

export const GeoLocationValidationSchema = Joi.object({
  types: Joi.array().items(Joi.string()),
  formatted_address: Joi.string().required(),
  address_components: Joi.array().items(
    Joi.object({
      short_name: Joi.string(),
      long_name: Joi.string(),
      postcode_localities: Joi.array().items(Joi.string()),
      types: Joi.array().items(Joi.string()),
    }),
  ),
  partial_match: Joi.boolean(),
  place_id: Joi.string(),
  plus_code: Joi.object({
    compound_code: Joi.string(),
    global_code: Joi.string(),
  }),
  postcode_localities: Joi.array().items(Joi.string()),
  geometry: Joi.object({
    location: GeoPointBodyValidationSchema.required(),
    location_type: Joi.string(),
    viewport: Joi.object(),
    bounds: Joi.object(),
  }).required(),
});

export const CreateLocationValidationSchema = Joi.object({
  zipCode: Joi.string().required(),
  name: Joi.string().required(),
  stateCode: Joi.string().required(),
  stateName: Joi.string().required(),
  location: GeoPointBodyValidationSchema.required(),
});

export const UpdateLocationValidationSchema = CreateLocationValidationSchema.fork(
  Object.keys(CreateLocationValidationSchema.describe().keys),
  (schema) => schema.optional(),
);

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
    direction: Joi.string().valid(...ORDER_VALUES),
  })
  .and('orderby', 'direction')
  .keys({
    location: GeoPointQueryParamValidationSchema,
    distance: DistanceQueryParamValidationSchema,
  })
  .and('location', 'distance');
