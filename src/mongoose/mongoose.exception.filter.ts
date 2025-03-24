import {
  Catch,
  ArgumentsHost,
  ConflictException,
  InternalServerErrorException,
} from '@nestjs/common';
import { BaseExceptionFilter } from '@nestjs/core';
import { mongo } from 'mongoose';
import {
  MONGO_UNIQUE_INDEX_CONFLICT,
  UNIQUE_CONSTRAIN_ERROR,
} from '../utils/constants';

const { MongoError } = mongo;

@Catch(MongoError)
export class MongoExceptionFilter extends BaseExceptionFilter {
  constructor() {
    super();
  }

  catch(exception: InstanceType<typeof MongoError>, host: ArgumentsHost) {
    if (exception.code === MONGO_UNIQUE_INDEX_CONFLICT) {
      super.catch(
        new ConflictException({
          message: 'Conflict',
          type: UNIQUE_CONSTRAIN_ERROR,
          error: exception,
          statusCode: 409,
        }),
        host,
      );
    } else {
      super.catch(new InternalServerErrorException(exception.message), host);
    }
  }
}
