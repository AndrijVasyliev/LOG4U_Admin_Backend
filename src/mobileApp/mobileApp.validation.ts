import * as Joi from 'joi';
import { TRUCK_STATUSES } from '../utils/constants';

export const MobileAuthValidation = Joi.object({
  deviceId: Joi.string().required(),
  userPermissions: Joi.object().pattern(Joi.string(), Joi.string()),
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
