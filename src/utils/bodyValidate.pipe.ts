import {
  PipeTransform,
  Injectable,
  ArgumentMetadata,
  BadRequestException,
} from '@nestjs/common';
import { ObjectSchema, ArraySchema } from 'joi';
import { BODY_VALIDATION_ERROR } from './constants';

@Injectable()
export class BodyValidationPipe implements PipeTransform {
  constructor(private schema: ObjectSchema | ArraySchema) {}

  transform(value: any, metadata: ArgumentMetadata) {
    if (metadata.type !== 'body') {
      return value;
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
