import * as Joi from 'joi';
import {
  ORDER_VALUES,
  TRUCK_CERTIFICATES,
  TRUCK_CROSSBORDERS,
  TRUCK_EQUIPMENTS,
  TRUCK_STATUSES,
  TRUCK_TYPES,
} from '../utils/constants';
import { MongoObjectIdValidation } from '../utils/idValidate.pipe';
import {
  GeoPointQueryParamValidation,
  DistanceQueryParamValidation,
  GeoPointBodyValidation,
} from '../location/location.validation';

export const CreateTruckValidation = Joi.object({
  truckNumber: Joi.number().min(0).required(),
  status: Joi.string()
    .valid(...TRUCK_STATUSES)
    .required(),
  lastLocation: GeoPointBodyValidation.optional(),
  availabilityLocation: GeoPointBodyValidation.optional(),
  availabilityAtLocal: Joi.date().iso().optional(),
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
  reservedAt: Joi.alternatives(null, Joi.date().iso().required()).optional(),
});

export const UpdateTruckValidation = CreateTruckValidation.fork(
  Object.keys(CreateTruckValidation.describe().keys),
  (schema) => schema.optional(),
);

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
  availableBefore: Joi.date()
    .iso()
    .when(Joi.ref('availableAfter'), {
      not: Joi.exist(),
      then: Joi.any(),
      otherwise: Joi.date().iso().min(Joi.ref('availableAfter')),
    })
    .optional(),
  availableAfter: Joi.date().iso().optional(),
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
    ),
    direction: Joi.string().valid(...ORDER_VALUES),
  })
  .and('orderby', 'direction')
  .keys({
    lastLocation: GeoPointQueryParamValidation,
    distance: DistanceQueryParamValidation,
  })
  .and('lastLocation', 'distance');
