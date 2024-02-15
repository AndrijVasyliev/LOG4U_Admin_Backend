import * as Joi from 'joi';

export const SendPushValidation = Joi.object({
  to: Joi.string().required(),
  sound: Joi.string().optional(),
  title: Joi.string().optional(),
  subtitle: Joi.string().optional(),
  body: Joi.string().optional(),
  data: Joi.object().optional(),
  ttl: Joi.number().optional(),
  expiration: Joi.number().optional(),
  priority: Joi.string().valid('default', 'normal', 'high').optional(),
  badge: Joi.number().optional(),
  channelId: Joi.string().optional(),
  categoryId: Joi.string().optional(),
  mutableContent: Joi.boolean().optional(),
});
