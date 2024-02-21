import * as Joi from 'joi';

export const ChatMessageValidation = Joi.object({
  body: Joi.string().required(),
});
