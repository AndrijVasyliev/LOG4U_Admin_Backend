import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response } from 'express';
import * as rTracer from 'cls-rtracer';
import { ConfigService } from '@nestjs/config';
import { LoggerService } from './logger.service';

@Injectable()
export class RequestIdMiddleware implements NestMiddleware {
  private readonly tracerCallback: ReturnType<typeof rTracer.expressMiddleware>;
  constructor(
    private readonly configService: ConfigService,
    private readonly log: LoggerService,
  ) {
    const requestIdHeader = this.configService.get<string>(
      'log.requestIdHeader',
    ) as string;
    this.tracerCallback = rTracer.expressMiddleware({
      useHeader: true,
      headerName: requestIdHeader,
      echoHeader: true,
    });
  }
  public use(req: Request, res: Response, next: () => void) {
    this.tracerCallback(req, res, next);
  }
}
