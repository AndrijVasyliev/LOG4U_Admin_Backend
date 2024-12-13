import * as Joi from 'joi';
import { Expo } from 'expo-server-sdk';
import {
  GeoPointBodyValidationSchema,
  LatitudeValidationSchema,
  LongitudeValidationSchema,
} from '../location/location.validation';
import {
  CreateLoadValidationSchema,
  StopDeliveryDriversInfoValidationSchema,
  StopPickUpDriversInfoValidationSchema,
} from '../load/load.validation';
import {
  ORDER_VALUES,
  STOP_DELIVERY_STATUSES,
  STOP_PICKUP_STATUSES,
  TRUCK_STATUSES,
} from '../utils/constants';

export const MobileAuthValidationSchema = Joi.object({
  force: Joi.boolean().optional(),
  deviceId: Joi.string().required(),
});

export const MobileAuthDataValidationSchema = Joi.object({
  deviceStatus: Joi.object().optional(),
  appPermissions: Joi.object().optional(),
  token: Joi.string()
    .allow('')
    .messages({
      'custom.token': 'Not valid token format',
    })
    .custom((value: string, helper) => {
      if (!Expo.isExpoPushToken(value)) {
        return helper.error('custom.token');
      }
      return value;
    })
    .optional(),
});

export const MobileUpdateLoadValidationSchema = CreateLoadValidationSchema.fork(
  Object.keys(CreateLoadValidationSchema.describe().keys).filter(
    (key) => key !== 'stops',
  ),
  (schema) => schema.forbidden(),
);

export const MobileUpdateLoadStopPickUpStatusValidationSchema = Joi.object({
  status: Joi.string()
    .valid(...STOP_PICKUP_STATUSES)
    .required(),
});

export const MobileUpdateLoadStopDeliveryStatusValidationSchema = Joi.object({
  status: Joi.string()
    .valid(...STOP_DELIVERY_STATUSES)
    .required(),
});

export const MobileSetStopPickUpDriversInfoValidationSchema = Joi.array()
  .items(StopPickUpDriversInfoValidationSchema)
  .required();

export const MobileSetStopDeliveryDriversInfoValidationSchema = Joi.array()
  .items(StopDeliveryDriversInfoValidationSchema)
  .required();

export const MobileUpdateTruckValidationSchema = Joi.object({
  lastLocation: GeoPointBodyValidationSchema.optional(),
  status: Joi.string()
    .valid(...TRUCK_STATUSES)
    .optional(),
  availabilityLocation: GeoPointBodyValidationSchema.optional(),
  availabilityAtLocal: Joi.date().iso().optional(),
});

export const MobileDeviceIdValidationSchema = Joi.string().required();

export const MobileUpdateTruckLocationValidationSchema = Joi.object({
  location: Joi.object({
    coords: Joi.object({
      latitude: LatitudeValidationSchema,
      longitude: LongitudeValidationSchema,
    })
      // .unknown(true)
      .options({ stripUnknown: { arrays: true, objects: true }})
      .required(),
  })
    // .unknown(true)
    .required(),
})
  // .unknown(true)
  .options({ stripUnknown: { arrays: true, objects: true }})
  .required();

export const MobileLoadQueryParamsSchema = Joi.object({
  offset: Joi.number().integer().min(0).optional(),
  limit: Joi.number().integer().min(1).optional(),
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
    direction: Joi.string().valid(...ORDER_VALUES),
  })
  .and('orderby', 'direction');
