import * as Joi from 'joi';
import { Expo } from 'expo-server-sdk';
import {
  GeoPointBodyValidation,
  LatitudeValidation,
  LongitudeValidation,
} from '../location/location.validation';
import {
  CreateLoadValidation,
  StopDeliveryDriversInfoValidation,
  StopPickUpDriversInfoValidation,
} from '../load/load.validation';
import {
  ORDER_VALUES,
  STOP_DELIVERY_STATUSES,
  STOP_PICKUP_STATUSES,
  TRUCK_STATUSES,
} from '../utils/constants';

export const MobileAuthValidation = Joi.object({
  force: Joi.boolean().optional(),
  deviceId: Joi.string().required(),
});

export const MobileAuthDataValidation = Joi.object({
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

export const MobileUpdateLoadValidation = CreateLoadValidation.fork(
  Object.keys(CreateLoadValidation.describe().keys).filter(
    (key) => key !== 'stops',
  ),
  (schema) => schema.forbidden(),
);

export const MobileUpdateLoadStopPickUpStatusValidation = Joi.object({
  status: Joi.string()
    .valid(...STOP_PICKUP_STATUSES)
    .required(),
});

export const MobileUpdateLoadStopDeliveryStatusValidation = Joi.object({
  status: Joi.string()
    .valid(...STOP_DELIVERY_STATUSES)
    .required(),
});

export const MobileSetStopPickUpDriversInfoValidation = Joi.array()
  .items(StopPickUpDriversInfoValidation)
  .required();

export const MobileSetStopDeliveryDriversInfoValidation = Joi.array()
  .items(StopDeliveryDriversInfoValidation)
  .required();

export const MobileUpdateTruckValidation = Joi.object({
  lastLocation: GeoPointBodyValidation.optional(),
  status: Joi.string()
    .valid(...TRUCK_STATUSES)
    .optional(),
  availabilityLocation: GeoPointBodyValidation.optional(),
  availabilityAtLocal: Joi.date().iso().optional(),
});

export const MobileDeviceIdValidationSchema = Joi.string().required();

export const MobileUpdateTruckLocationValidation = Joi.object({
  location: Joi.object({
    coords: Joi.object({
      latitude: LatitudeValidation,
      longitude: LongitudeValidation,
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
