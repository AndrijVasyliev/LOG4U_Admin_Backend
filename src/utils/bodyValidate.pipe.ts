import {
  PipeTransform,
  Injectable,
  ArgumentMetadata,
  BadRequestException,
} from '@nestjs/common';
import { ObjectSchema, ArraySchema, StringSchema } from 'joi';
import { BODY_VALIDATION_ERROR } from './constants';

@Injectable()
export class BodySchemaPipe<T = any, R = any> implements PipeTransform<T, R> {
  constructor(private schema: ObjectSchema | ArraySchema | StringSchema) {}

  transform(value: T, metadata: ArgumentMetadata): R {
    if (metadata.type !== 'body') {
      return value as unknown as R;
    }
    const { error, value: transformedValue } = this.schema.validate(value, {
      abortEarly: false,
    });
    if (error) {
      throw new BadRequestException({ type: BODY_VALIDATION_ERROR, error });
    }
    return transformedValue;
  }
}
