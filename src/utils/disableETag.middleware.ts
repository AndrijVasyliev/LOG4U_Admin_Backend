import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response } from 'express';

@Injectable()
export class DisableETagMiddleware implements NestMiddleware {
  public use(req: Request, res: Response, next: () => void) {
    res.setHeader('Last-Modified', new Date().toUTCString());
    next();
  }
}
