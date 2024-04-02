import * as Joi from 'joi';
import { MongoObjectIdValidation } from '../utils/idValidate.pipe';
import { FILE_OF_TYPES } from '../utils/constants';

export const CreateFileValidation = Joi.object({
  linkedTo: MongoObjectIdValidation.required(),
  fileOf: Joi.string()
    .valid(...FILE_OF_TYPES)
    .required(),
});

export const FileQueryParamsSchema = Joi.object({
  offset: Joi.number().integer().min(0).optional(),
  limit: Joi.number().integer().min(1).optional(),
  filename: Joi.string().optional(),
})
  .keys({
    orderby: Joi.string().valid('filename', 'createdAt'),
    direction: Joi.string().valid('asc', 'desc'),
  })
  .and('orderby', 'direction')
  .keys({
    truck: MongoObjectIdValidation.optional(),
    person: MongoObjectIdValidation.optional(),
  })
  .oxor('truck', 'person');
