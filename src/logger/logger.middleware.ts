import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response } from 'express';

import { LoggerService } from './logger.service';

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  constructor(private readonly logger: LoggerService) {}

  public use(req: Request, res: Response, next: () => void) {
    const log = this.logger;
    log.http(
      `${req.method}: ${req.hostname}(${req.ip})${req.originalUrl} -> ${
        req.socket.localAddress
      }:${req.socket.localPort}, ${JSON.stringify(req.headers)}`,
    );
    next();
    res.on('finish', () => {
      const rt = res.get('X-Response-Time');
      log.http(`${rt} Response code: ${res.statusCode}`);
    });
  }
}
