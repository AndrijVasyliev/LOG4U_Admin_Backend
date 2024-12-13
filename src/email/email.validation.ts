import * as Joi from 'joi';
import { MongoObjectIdValidationSchema } from '../utils/idValidate.pipe';
import { EMAIL_STATES, EMAIL_TO_TYPES, ORDER_VALUES } from '../utils/constants';

export const SendEmailValidationSchema = Joi.object({
  from: Joi.string().required(),
  to: Joi.string().required(),
  subject: Joi.string().required(),
  text: Joi.string().required(),
  html: Joi.string().optional(),
});

export const CreateEmailValidationSchema = Joi.object({
  from: Joi.string().required(),
  to: Joi.array()
    .items(
      Joi.object({
        to: MongoObjectIdValidationSchema.required(),
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

export const UpdateEmailValidationSchema = Joi.object({
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
    direction: Joi.string().valid(...ORDER_VALUES),
  })
  .and('orderby', 'direction');
