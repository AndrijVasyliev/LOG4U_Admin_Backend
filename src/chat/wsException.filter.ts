import { Catch, ArgumentsHost } from '@nestjs/common';
import { BaseWsExceptionFilter, WsException } from '@nestjs/websockets';
import { LoggerService } from '../logger';

@Catch()
export class WsExceptionFilter extends BaseWsExceptionFilter {
  constructor(private readonly logger: LoggerService) {
    super();
  }
  catch(exception: unknown, host: ArgumentsHost) {
    if (exception instanceof WsException) {
      this.logger.debug(exception as WsException);
    }
    super.catch(exception, host);
  }
}
