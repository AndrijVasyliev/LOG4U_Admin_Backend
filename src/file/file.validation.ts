import * as Joi from 'joi';
import { MongoObjectIdValidationSchema } from '../utils/idValidate.pipe';
import {
  FILE_OF_TYPES,
  MAX_FILE_COMMENT_LENGTH,
  MIN_FILE_COMMENT_LENGTH,
  ORDER_VALUES,
} from '../utils/constants';

export const CreateFileValidationSchema = Joi.object({
  linkedTo: MongoObjectIdValidationSchema.required(),
  fileOf: Joi.string()
    .valid(...FILE_OF_TYPES)
    .required(),
  comment: Joi.string()
    .min(MIN_FILE_COMMENT_LENGTH)
    .max(MAX_FILE_COMMENT_LENGTH)
    .optional(),
  tags: Joi.object()
    .pattern(Joi.string().required(), Joi.string().required())
    .cast('map')
    .optional(),
});

export const FileQueryParamsSchema = Joi.object({
  offset: Joi.number().integer().min(0).optional(),
  limit: Joi.number().integer().min(1).optional(),
  filename: Joi.string().optional(),
  comment: Joi.string()
    .min(MIN_FILE_COMMENT_LENGTH)
    .max(MAX_FILE_COMMENT_LENGTH)
    .optional(),
  tags: Joi.object()
    .pattern(Joi.string().required(), Joi.string().required())
    .cast('map')
    .optional(),
})
  .keys({
    orderby: Joi.string().valid('filename', 'createdAt'),
    direction: Joi.string().valid(...ORDER_VALUES),
  })
  .and('orderby', 'direction')
  .keys({
    linkedTo: MongoObjectIdValidationSchema.required(),
    fileOf: Joi.string()
      .valid(...FILE_OF_TYPES)
      .optional(),
  })
  .and('linkedTo', 'fileOf');
