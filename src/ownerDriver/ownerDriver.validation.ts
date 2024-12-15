import * as Joi from 'joi';
import { LANG_PRIORITIES, ORDER_VALUES } from '../utils/constants';

export const CreateOwnerDriverValidationSchema = Joi.object({
  fullName: Joi.string().required(),
  birthDate: Joi.date().iso().required(),
  citizenship: Joi.string().required(),
  languagePriority: Joi.string()
    .valid(...LANG_PRIORITIES)
    .required(),
  driverLicenceNumber: Joi.string().required(),
  driverLicenceState: Joi.string().required(),
  driverLicenceExp: Joi.date().iso().required(),
  idDocId: Joi.string().allow('').optional(),
  idDocType: Joi.string().allow('').optional(),
  idDocExp: Joi.date().iso().optional(),
  hiredBy: Joi.string().required(),
  hireDate: Joi.date().iso().required(),
  snn: Joi.string().required(),
  company: Joi.string().allow('').optional(),
  insurancePolicy: Joi.string().required(),
  insurancePolicyExp: Joi.date().iso().required(),
  address: Joi.string().required(),
  phone: Joi.string().required(),
  phone2: Joi.string().allow('').allow('').optional(),
  email: Joi.string().required(),
  emergencyContactName: Joi.string().allow('').optional(),
  emergencyContactRel: Joi.string().allow('').optional(),
  emergencyContactPhone: Joi.string().allow('').optional(),
  notes: Joi.string().allow('').optional(),
  appLogin: Joi.string().allow('').optional(),
  appPass: Joi.string().allow('').optional(),
});

export const UpdateOwnerDriverValidationSchema =
  CreateOwnerDriverValidationSchema.fork(
    Object.keys(CreateOwnerDriverValidationSchema.describe().keys),
    (schema) => schema.optional(),
  );

export const OwnerDriverQueryParamsSchema = Joi.object({
  offset: Joi.number().integer().min(0).optional(),
  limit: Joi.number().integer().min(1).optional(),
  search: Joi.string().optional(),
  fullName: Joi.string().optional(),
  citizenship: Joi.string().optional(),
  languagePriority: Joi.string()
    .valid(...LANG_PRIORITIES)
    .optional(),
  driverLicenceNumber: Joi.string().optional(),
  driverLicenceState: Joi.string().optional(),
  idDocId: Joi.string().optional(),
  idDocType: Joi.string().optional(),
  hiredBy: Joi.string().optional(),
  snn: Joi.string().optional(),
  company: Joi.string().optional(),
  insurancePolicy: Joi.string().optional(),
  address: Joi.string().optional(),
  phone: Joi.string().optional(),
  phone2: Joi.string().optional(),
  email: Joi.string().optional(),
  emergencyContactName: Joi.string().optional(),
  emergencyContactRel: Joi.string().optional(),
  emergencyContactPhone: Joi.string().optional(),
  appLogin: Joi.string().optional(),
  truckNumber: Joi.number().optional(),
  owner: Joi.string().optional(),
})
  .keys({
    orderby: Joi.string().valid(
      'fullName',
      'birthDate',
      'citizenship',
      'languagePriority',
      'driverLicenceNumber',
      'driverLicenceState',
      'driverLicenceExp',
      'idDocId',
      'idDocType',
      'idDocExp',
      'hiredBy',
      'hireDate',
      'snn',
      'company',
      'insurancePolicy',
      'insurancePolicyExp',
      'address',
      'phone',
      'phone2',
      'email',
      'emergencyContactName',
      'emergencyContactRel',
      'emergencyContactPhone',
      'appLogin',
    ),
    direction: Joi.string().valid(...ORDER_VALUES),
  })
  .and('orderby', 'direction');
