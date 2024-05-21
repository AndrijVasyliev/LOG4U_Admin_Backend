import * as Joi from 'joi';
import { MongoObjectIdValidation } from '../utils/idValidate.pipe';
import {
  FILE_OF_TYPES,
  MAX_FILE_COMMENT_LENGTH,
  MIN_FILE_COMMENT_LENGTH,
} from '../utils/constants';

export const CreateFileValidation = Joi.object({
  linkedTo: MongoObjectIdValidation.required(),
  fileOf: Joi.string()
    .valid(...FILE_OF_TYPES)
    .required(),
  comment: Joi.string()
    .min(MIN_FILE_COMMENT_LENGTH)
    .max(MAX_FILE_COMMENT_LENGTH)
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
})
  .keys({
    orderby: Joi.string().valid('filename', 'createdAt'),
    direction: Joi.string().valid('asc', 'desc'),
  })
  .and('orderby', 'direction')
  .keys({
    truck: MongoObjectIdValidation.optional(),
    person: MongoObjectIdValidation.optional(),
    load: MongoObjectIdValidation.optional(),
  })
  .oxor('truck', 'person', 'load');
