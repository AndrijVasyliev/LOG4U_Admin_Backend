import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response } from 'express';
import * as responseTime from 'response-time';

const responseTimeCallback = responseTime({
  header: 'X-Response-Time',
});

@Injectable()
export class ResponseTimeMiddleware implements NestMiddleware {
  public use(req: Request, res: Response, next: () => void) {
    responseTimeCallback(req, res, next);
  }
}
