import * as Joi from 'joi';
import {
  EARTH_RADIUS_MILES,
  TRUCK_CERTIFICATES,
  TRUCK_CROSSBORDERS,
  TRUCK_EQUIPMENTS,
  TRUCK_STATUSES,
  TRUCK_TYPES,
} from '../utils/constants';
import { MongoObjectIdValidation } from '../utils/idValidate.pipe';
import { TruckStatus } from '../utils/general.dto';

export const CreateTruckValidation = Joi.object({
  truckNumber: Joi.number().min(0).required(),
  status: Joi.string()
    .valid(...TRUCK_STATUSES)
    .required(),
  lastLocation: Joi.array()
    .min(2)
    .max(2)
    .items(
      Joi.number().min(-90).max(90).required(),
      Joi.number().min(-180).max(180).required(),
    )
    .optional(),
  availabilityLocation: Joi.array()
    .min(2)
    .max(2)
    .items(
      Joi.number().min(-90).max(90).required(),
      Joi.number().min(-180).max(180).required(),
    )
    .optional(),
  availabilityAt: Joi.date().iso().greater('now').optional(),
  crossborder: Joi.string()
    .valid(...TRUCK_CROSSBORDERS)
    .required(),
  certificate: Joi.string()
    .valid(...TRUCK_CERTIFICATES)
    .optional(),
  type: Joi.string()
    .valid(...TRUCK_TYPES)
    .required(),
  equipment: Joi.array()
    .items(
      Joi.string()
        .valid(...TRUCK_EQUIPMENTS)
        .optional(),
    )
    .optional(),
  payload: Joi.number().integer().required(),
  grossWeight: Joi.string().required(),
  make: Joi.string().required(),
  model: Joi.string().required(),
  year: Joi.number().integer().required(),
  color: Joi.string().required(),
  vinCode: Joi.string().required(),
  licencePlate: Joi.string().required(),
  insideDims: Joi.string().required(),
  doorDims: Joi.string().required(),
  owner: MongoObjectIdValidation.required(),
  coordinator: Joi.alternatives(null, MongoObjectIdValidation).optional(),
  driver: Joi.alternatives(null, MongoObjectIdValidation).optional(),
});

export const UpdateTruckValidation = Joi.object({
  truckNumber: Joi.number().min(0).optional(),
  status: Joi.string()
    .valid(...TRUCK_STATUSES)
    .optional(),
  lastLocation: Joi.array()
    .min(2)
    .max(2)
    .items(
      Joi.number().min(-90).max(90).required(),
      Joi.number().min(-180).max(180).required(),
    )
    .optional(),
  availabilityLocation: Joi.array()
    .min(2)
    .max(2)
    .items(
      Joi.number().min(-90).max(90).required(),
      Joi.number().min(-180).max(180).required(),
    )
    .optional(),
  availabilityAt: Joi.date().iso().greater('now').optional(),
  crossborder: Joi.string()
    .valid(...TRUCK_CROSSBORDERS)
    .optional(),
  certificate: Joi.string()
    .valid(...TRUCK_CERTIFICATES)
    .optional(),
  type: Joi.string()
    .valid(...TRUCK_TYPES)
    .optional(),
  equipment: Joi.array()
    .items(
      Joi.string()
        .valid(...TRUCK_EQUIPMENTS)
        .optional(),
    )
    .optional(),
  payload: Joi.number().integer().optional(),
  grossWeight: Joi.string().optional(),
  make: Joi.string().optional(),
  model: Joi.string().optional(),
  year: Joi.number().integer().optional(),
  color: Joi.string().optional(),
  vinCode: Joi.string().optional(),
  licencePlate: Joi.string().optional(),
  insideDims: Joi.string().optional(),
  doorDims: Joi.string().optional(),
  owner: MongoObjectIdValidation.optional(),
  coordinator: Joi.alternatives(null, MongoObjectIdValidation).optional(),
  driver: Joi.alternatives(null, MongoObjectIdValidation).optional(),
  reservedAt: Joi.alternatives(null, Joi.date().iso().required()).optional(),
});

export const TruckQueryParamsSchema = Joi.object({
  offset: Joi.number().integer().min(0).optional(),
  limit: Joi.number().integer().min(1).optional(),
  search: Joi.string().optional(),
  truckNumber: Joi.number().min(0).optional(),
  status: Joi.alternatives(
    Joi.string()
      .valid(...TRUCK_STATUSES)
      .required(),
    Joi.array()
      .items(
        Joi.string()
          .valid(...TRUCK_STATUSES)
          .required(),
      )
      .min(1)
      .required(),
  )
    .custom((value: string | string[]) => {
      if (Array.isArray(value)) {
        return value;
      }
      return value.split(',');
    })
    .optional(),
  crossborder: Joi.string()
    .valid(...TRUCK_CROSSBORDERS)
    .optional(),
  certificate: Joi.string()
    .valid(...TRUCK_CERTIFICATES)
    .optional(),
  type: Joi.string()
    .valid(...TRUCK_TYPES)
    .optional(),
  equipment: Joi.string()
    .valid(...TRUCK_EQUIPMENTS)
    .optional(),
  grossWeight: Joi.string().optional(),
  make: Joi.string().optional(),
  model: Joi.string().optional(),
  color: Joi.string().optional(),
  vinCode: Joi.string().optional(),
  licencePlate: Joi.string().optional(),
})
  .keys({
    orderby: Joi.string().valid(
      'truckNumber',
      'status',
      'crossborder',
      'certificate',
      'type',
      'payload',
      'grossWeight',
      'make',
      'model',
      'year',
      'color',
      'vinCode',
      'licencePlate',
      'insideDims',
      'doorDims',
    ),
    direction: Joi.string().valid('asc', 'desc'),
  })
  .and('orderby', 'direction')
  .keys({
    lastLocation: Joi.string()
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
      }),
    distance: Joi.number().min(0).max(EARTH_RADIUS_MILES),
  })
  .and('lastLocation', 'distance');
