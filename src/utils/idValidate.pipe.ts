import * as Joi from 'joi';
import { Types } from 'mongoose';
import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common';
import { VALIDATION_ERROR } from './constants';

export const MongoObjectIdValidationSchema = Joi.string<Types.ObjectId>()
  .messages({
    'custom.notValidObjectId': 'Value is not valid ObjectId',
  })
  .custom((value: string, helper) => {
    const isValid = Types.ObjectId.isValid(value);
    if (!isValid) {
      return helper.error('custom.notValidObjectId');
    }
    return new Types.ObjectId(value);
  })
  .required();

@Injectable()
export class MongoObjectIdPipe implements PipeTransform<any, Types.ObjectId> {
  transform(value: any): Types.ObjectId {
    const { error, value: transformedValue } = MongoObjectIdValidationSchema.validate(value);

    if (error) {
      throw new BadRequestException({
        type: VALIDATION_ERROR,
        error,
      });
    }

    return transformedValue;
  }
}
