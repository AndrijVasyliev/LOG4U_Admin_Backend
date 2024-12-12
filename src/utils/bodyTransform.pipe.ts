import {
  PipeTransform,
  Injectable,
  ArgumentMetadata,
  InternalServerErrorException,
} from '@nestjs/common';
import { BODY_TRANSFORM_ERROR } from './constants';

@Injectable()
export class BodyTransformPipe<T = any, R = any>
  implements PipeTransform<T, R>
{
  constructor(private transformer: (initialBody: T) => R) {}

  transform(value: T, metadata: ArgumentMetadata): R {
    if (metadata.type !== 'body') {
      return value as unknown as R;
    }
    try {
      return this.transformer(value);
    } catch (error) {
      throw new InternalServerErrorException({
        type: BODY_TRANSFORM_ERROR,
        error,
      });
    }
  }
}
