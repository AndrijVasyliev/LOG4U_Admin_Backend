import {
  Catch,
  ArgumentsHost,
  InternalServerErrorException,
} from '@nestjs/common';
import { BaseExceptionFilter } from '@nestjs/core';
import { LoggerService } from './logger.service';
import { HttpException } from '@nestjs/common/exceptions/http.exception';

@Catch()
export class LoggerExceptionFilter extends BaseExceptionFilter {
  constructor(private readonly logger: LoggerService) {
    super();
  }

  catch(exception: unknown, host: ArgumentsHost) {
    if (exception instanceof HttpException) {
      super.catch(exception, host);
    } else if (exception instanceof Error) {
      this.logger.debug(exception);
      super.catch(new InternalServerErrorException(exception.message), host);
    } else {
      this.logger.debug(JSON.stringify(exception));
      super.catch(
        new InternalServerErrorException(JSON.stringify(exception)),
        host,
      );
    }
  }
}
