import * as Joi from 'joi';

export const SendPushValidation = Joi.object({
  to: Joi.string().required(),
  sound: Joi.string().required(),
  body: Joi.string().required(),
  data: Joi.object().optional(),
});
