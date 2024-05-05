import * as Joi from 'joi';
import { CUSTOMER_TYPES, USER_ROLES } from '../utils/constants';

export const CreateCustomerValidation = Joi.object({
  name: Joi.string().required(),
  type: Joi.string()
    .valid(...CUSTOMER_TYPES)
    .required(),
  address: Joi.string().required(),
  address2: Joi.string().allow('').optional(),
  city: Joi.string().required(),
  state: Joi.string().required(),
  zipCode: Joi.string().required(),
  phone: Joi.string().required(),
  fax: Joi.string().allow('').optional(),
  email: Joi.string().required(),
  website: Joi.string().allow('').optional(),
});

export const UpdateCustomerValidation = Joi.object({
  name: Joi.string().optional(),
  type: Joi.string()
    .valid(...CUSTOMER_TYPES)
    .optional(),
  address: Joi.string().optional(),
  address2: Joi.string().allow('').optional(),
  city: Joi.string().optional(),
  state: Joi.string().optional(),
  zipCode: Joi.string().optional(),
  phone: Joi.string().optional(),
  fax: Joi.string().allow('').optional(),
  email: Joi.string().optional(),
  website: Joi.string().allow('').optional(),
});

export const CustomerQueryParamsSchema = Joi.object({
  offset: Joi.number().integer().min(0).optional(),
  limit: Joi.number().integer().min(1).optional(),
  search: Joi.string().optional(),
  name: Joi.string().optional(),
  type: Joi.string()
    .valid(...CUSTOMER_TYPES)
    .optional(),
  address: Joi.string().optional(),
  address2: Joi.string().optional(),
  city: Joi.string().optional(),
  state: Joi.string().optional(),
  zipCode: Joi.string().optional(),
  phone: Joi.string().optional(),
  fax: Joi.string().optional(),
  email: Joi.string().optional(),
  website: Joi.string().optional(),
})
  .keys({
    orderby: Joi.string().valid(
      'name',
      'type',
      'address',
      'city',
      'state',
      'zipCode',
      'phone',
      'email',
    ),
    direction: Joi.string().valid('asc', 'desc'),
  })
  .and('orderby', 'direction');
