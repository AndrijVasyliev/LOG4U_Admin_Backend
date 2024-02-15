import * as Joi from 'joi';

export const SendEmailValidation = Joi.object({
  from: Joi.string().required(),
  to: Joi.string().required(),
  subject: Joi.string().required(),
  text: Joi.string().required(),
  html: Joi.string().optional(),
});
