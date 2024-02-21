import * as Joi from 'joi';
import { MongoObjectIdValidation } from '../utils/idValidate.pipe';
import { EMAIL_STATES, EMAIL_TO_TYPES } from '../utils/constants';

export const SendEmailValidation = Joi.object({
  from: Joi.string().required(),
  to: Joi.string().required(),
  subject: Joi.string().required(),
  text: Joi.string().required(),
  html: Joi.string().optional(),
});

export const CreateEmailValidation = Joi.object({
  from: Joi.string().required(),
  to: Joi.array()
    .items(
      Joi.object({
        to: MongoObjectIdValidation.required(),
        toType: Joi.string()
          .valid(...EMAIL_TO_TYPES)
          .required(),
      }).required(),
    )
    .min(1)
    .required(),
  subject: Joi.string().required(),
  text: Joi.string().required(),
  html: Joi.string().optional(),
});

export const UpdateEmailValidation = Joi.object({
  state: Joi.string()
    .valid(...EMAIL_STATES)
    .optional(),
  from: Joi.string().optional(),
  subject: Joi.string().optional(),
  text: Joi.string().optional(),
  html: Joi.string().optional(),
});

export const EmailQueryParamsSchema = Joi.object({
  offset: Joi.number().integer().min(0).optional(),
  limit: Joi.number().integer().min(1).optional(),
  // search: Joi.string().optional(),
  state: Joi.string()
    .valid(...EMAIL_STATES)
    .optional(),
  from: Joi.string().optional(),
  toType: Joi.string()
    .valid(...EMAIL_TO_TYPES)
    .optional(),
  subject: Joi.string().optional(),
})
  .keys({
    orderby: Joi.string().valid(
      'state',
      'from',
      'subject',
      'createdAt',
      'updatedAt',
    ),
    direction: Joi.string().valid('asc', 'desc'),
  })
  .and('orderby', 'direction');
