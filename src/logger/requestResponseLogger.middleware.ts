import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, Send } from 'express';

import { LoggerService } from './logger.service';

// ToDo Refactor response body logger
const resDotSendInterceptor = (res: Response, send: Send) => {
  return (content: any) => {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    res.contentBody = content;
    res.send = send;
    res.send(content);
  };
};

@Injectable()
export class RequestResponseLoggerMiddleware implements NestMiddleware {
  constructor(private readonly logger: LoggerService) {}

  public use(req: Request, res: Response, next: () => void) {
    const log = this.logger;
    log.http(
      `${req.method}: ${req.hostname}(${req.ip})${req.originalUrl} -> ${req.socket.localAddress}:${req.socket.localPort}`,
    );
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    res.send = resDotSendInterceptor(res, res.send);
    res.on('finish', () => {
      const rt = res.get('X-Response-Time');
      const login = req.get('X-User-Login');
      const deviceId = req.get('X-Device-Id');
      log.http(
        `${rt} ${req.method}:${req.originalUrl}${
          login ? ', User: ' + login : ''
        }${deviceId ? ', Device: ' + deviceId : ''}, Response code: ${
          res.statusCode
        }${
          res.statusCode < 200 || res.statusCode >= 300
            ? // eslint-disable-next-line @typescript-eslint/ban-ts-comment
              // @ts-ignore
              ', Response body: ' + JSON.stringify(res.contentBody)
            : ''
        }`,
      );
    });
    next();
  }
}
