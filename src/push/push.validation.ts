import * as Joi from 'joi';
import { MongoObjectIdValidationSchema } from '../utils/idValidate.pipe';
import { ORDER_VALUES, PUSH_STATES } from '../utils/constants';

export const SendPushValidationSchema = Joi.object({
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
  _contentAvailable: Joi.boolean().optional(),
});

export const CreatePushValidationSchema = Joi.object({
  to: MongoObjectIdValidationSchema.required(),
  title: Joi.string().optional(),
  subtitle: Joi.string().optional(),
  body: Joi.string().optional(),
  data: Joi.object().optional(),
  badge: Joi.number().optional(),
});

export const UpdatePushValidationSchema = Joi.object({
  state: Joi.string()
    .valid(...PUSH_STATES)
    .optional(),
  title: Joi.string().optional(),
  subtitle: Joi.string().optional(),
  body: Joi.string().optional(),
  data: Joi.object().optional(),
  badge: Joi.number().optional(),
});

export const PushQueryParamsSchema = Joi.object({
  offset: Joi.number().integer().min(0).optional(),
  limit: Joi.number().integer().min(1).optional(),
  search: Joi.string().optional(),
  truckNumber: Joi.number().optional(),
  state: Joi.string()
    .valid(...PUSH_STATES)
    .optional(),
  title: Joi.string().optional(),
  subtitle: Joi.string().optional(),
  body: Joi.string().optional(),
})
  .keys({
    orderby: Joi.string().valid(
      'state',
      'title',
      'subtitle',
      'body',
      'createdAt',
      'updatedAt',
    ),
    direction: Joi.string().valid(...ORDER_VALUES),
  })
  .and('orderby', 'direction');
