import {
  PipeTransform,
  Injectable,
  ArgumentMetadata,
  BadRequestException,
} from '@nestjs/common';
import { ObjectSchema, ArraySchema } from 'joi';
import { Query } from './general.dto';
import { DEFAULT_LIMIT, DEFAULT_OFFSET } from './constants';

@Injectable()
export class QueryParamsPipe<T> implements PipeTransform<any, Query<T>> {
  constructor(private schema: ObjectSchema | ArraySchema) {}

  transform(inputValue: any, metadata: ArgumentMetadata) {
    if (metadata.type !== 'query') {
      return inputValue;
    }
    const { error, value } = this.schema.validate(inputValue, { abortEarly: false });
    if (error) {
      throw new BadRequestException(
        `Query parameters validation failed: ${error.message}, ${JSON.stringify(
          error.details,
        )}`,
      );
    }
    const { offset = DEFAULT_OFFSET, limit = DEFAULT_LIMIT, orderby, direction, ...search } = value;
    let result: Query<T>;
    if (Object.keys(search).length) {
      result = {
        offset,
        limit,
        orderby,
        direction,
        search,
      };
    } else {
      result = {
        offset,
        limit,
        orderby,
        direction,
      };
    }
    return result;
  }
}
