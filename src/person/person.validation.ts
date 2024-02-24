/*import * as Joi from 'joi';
import { LANG_PRIORITIES } from '../utils/constants';

export const UpdatePersonValidation = Joi.object({
  fullName: Joi.string().optional(),
  birthDate: Joi.date().iso().optional(),
  citizenship: Joi.string().optional(),
  languagePriority: Joi.string()
    .valid(...LANG_PRIORITIES)
    .optional(),
  hiredBy: Joi.string().optional(),
  hireDate: Joi.date().iso().optional(),
  snn: Joi.string().optional(),
  company: Joi.string().allow('').optional(),
  insurancePolicy: Joi.string().optional(),
  insurancePolicyExp: Joi.date().iso().optional(),
  address: Joi.string().optional(),
  phone: Joi.string().optional(),
  phone2: Joi.string().allow('').optional(),
  email: Joi.string().optional(),
  emergencyContactName: Joi.string().allow('').optional(),
  emergencyContactRel: Joi.string().allow('').optional(),
  emergencyContactPhone: Joi.string().allow('').optional(),
  notes: Joi.string().allow('').optional(),
  appLogin: Joi.string().allow('').optional(),
  appPass: Joi.string().allow('').optional(),
});

export const PersonQueryParamsSchema = Joi.object({
  offset: Joi.number().integer().min(0).optional(),
  limit: Joi.number().integer().min(1).optional(),
  search: Joi.string().optional(),
  fullName: Joi.string().optional(),
  citizenship: Joi.string().optional(),
  languagePriority: Joi.string()
    .valid(...LANG_PRIORITIES)
    .optional(),
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
})
  .keys({
    orderby: Joi.string().valid(
      'fullName',
      'birthDate',
      'citizenship',
      'languagePriority',
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
    direction: Joi.string().valid('asc', 'desc'),
  })
  .and('orderby', 'direction');*/
