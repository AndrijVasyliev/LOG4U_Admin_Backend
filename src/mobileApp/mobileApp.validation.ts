import * as Joi from 'joi';
import { Expo } from 'expo-server-sdk';
import { TRUCK_STATUSES } from '../utils/constants';

export const MobileAuthValidation = Joi.object({
  force: Joi.boolean().optional(),
  deviceId: Joi.string().required(),
});

export const MobileAuthDataValidation = Joi.object({
  appPermissions: Joi.object().optional(),
  token: Joi.string()
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

export const MobileUpdateTruckValidation = Joi.object({
  status: Joi.string()
    .valid(...TRUCK_STATUSES)
    .optional(),
  //lastLocation: Joi.array()
  //  .min(2)
  //  .max(2)
  //  .items(
  //    Joi.number().min(-90).max(90).required(),
  //    Joi.number().min(-180).max(180).required(),
  //  )
  //  .optional(),
});
export const MobileUpdateTruckLocationValidation = Joi.object({
  deviceId: Joi.string().required(),
  location: Joi.object({
    coords: Joi.object({
      latitude: Joi.number().min(-90).max(90).required(),
      longitude: Joi.number().min(-180).max(180).required(),
    })
      .unknown(true)
      .required(),
  })
    .unknown(true)
    .required(),
})
  .unknown(true)
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
    direction: Joi.string().valid('asc', 'desc'),
  })
  .and('orderby', 'direction');
