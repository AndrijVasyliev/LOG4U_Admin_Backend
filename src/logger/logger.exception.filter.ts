import { Catch, ArgumentsHost } from '@nestjs/common';
import { BaseExceptionFilter } from '@nestjs/core';
import { LoggerService } from './logger.service';

@Catch()
export class LoggerExceptionFilter extends BaseExceptionFilter {
  constructor(private readonly logger: LoggerService) {
    super();
  }

  catch(exception: unknown, host: ArgumentsHost) {
    this.logger.debug(exception as Error);
    super.catch(exception, host);
  }
}
