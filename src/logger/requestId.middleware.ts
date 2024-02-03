import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response } from 'express';
import * as rTracer from 'cls-rtracer';

const rTracerCallback = rTracer.expressMiddleware({
  useHeader: true,
  headerName: 'X-Request-Id',
  echoHeader: true,
});

@Injectable()
export class RequestIdMiddleware implements NestMiddleware {
  public use(req: Request, res: Response, next: () => void) {
    rTracerCallback(req, res, next);
  }
}
