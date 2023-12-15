import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, Send } from 'express';

import { LoggerService } from './logger.service';
// ToDo Refactor response body logger
const resDotSendInterceptor = (res: Response, send: Send) => {
  const sendFunc = (content: any) => {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    res.contentBody = content;
    res.send = send;
    res.send(content);
  };
  return sendFunc;
};

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  constructor(private readonly logger: LoggerService) {}

  public use(req: Request, res: Response, next: () => void) {
    const log = this.logger;
    log.http(
      `${req.method}: ${req.hostname}(${req.ip})${req.originalUrl} -> ${
        req.socket.localAddress
      }:${req.socket.localPort}, ${JSON.stringify(
        req.headers,
      )}, ${JSON.stringify(req.body)}`,
    );
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    res.send = resDotSendInterceptor(res, res.send);
    res.on('finish', () => {
      const rt = res.get('X-Response-Time');
      log.http(`${rt} Response code: ${res.statusCode}`);
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      log.debug(`Response body: ${JSON.stringify(res.contentBody)}`);
    });
    next();
  }
}
