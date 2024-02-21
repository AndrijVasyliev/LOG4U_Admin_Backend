import { PipeTransform, Injectable, ArgumentMetadata } from '@nestjs/common';
import { WsException } from '@nestjs/websockets';
import { ObjectSchema, ArraySchema } from 'joi';
import { WS_MESSAGE_VALIDATION_ERROR } from '../utils/constants';

@Injectable()
export class WsValidationPipe implements PipeTransform {
  constructor(private schema: ObjectSchema | ArraySchema) {}

  transform(value: any, metadata: ArgumentMetadata) {
    if (metadata.type !== 'body') {
      return value;
    }
    const { error, value: transformedValue } = this.schema.validate(value, {
      abortEarly: false,
    });
    if (error) {
      throw new WsException({ type: WS_MESSAGE_VALIDATION_ERROR, error });
    }
    return transformedValue;
  }
}
