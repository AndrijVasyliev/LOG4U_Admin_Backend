import * as Joi from 'joi';
import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common';
import { PATHPARAM_VALIDATION_ERROR } from './constants';

export const MongoObjectIdValidation = Joi.string().hex().length(24).required();

@Injectable()
export class MongoObjectIdPipe implements PipeTransform<any, string> {
  transform(value: any): string {
    const { error } = MongoObjectIdValidation.validate(value);
    if (error) {
      throw new BadRequestException({
        type: PATHPARAM_VALIDATION_ERROR,
        error,
      });
    }

    return value;
  }
}
