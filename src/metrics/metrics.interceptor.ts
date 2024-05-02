import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { InjectMetric } from '@willsoto/nestjs-prometheus';
import { Request, Response } from 'express';
import { Counter, Summary } from 'prom-client';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { LoggerService } from '../logger';
import {
  API_PATH_PREFIX,
  MOBILE_PATH_PREFIX,
  DO_NOT_COLLECT_METRICS_KEY,
} from '../utils/constants';

@Injectable()
export class MetricsInterceptor implements NestInterceptor {
  constructor(
    private reflector: Reflector,
    private readonly log: LoggerService,
    @InjectMetric('incoming_requests') private counter: Counter<string>,
    @InjectMetric('incoming_requests_duration')
    private summary: Summary<string>,
  ) {}
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    this.log.debug('In metrics interceptor');
    if (
      context.getType() !== 'http' ||
      this.reflector.getAllAndOverride<boolean>(DO_NOT_COLLECT_METRICS_KEY, [
        context.getHandler(),
        context.getClass(),
      ])
    ) {
      return next.handle();
    }
    const httpContext = context.switchToHttp();
    const req = httpContext.getRequest<Request>();
    const res = httpContext.getResponse<Response>();
    console.log(req.url);

    const controllerPath = this.reflector.get<string | string[], string>(
      'path',
      context.getClass(),
    );
    const handlerPath = this.reflector.get<string | string[], string>(
      'path',
      context.getHandler(),
    );
    const fullPath =
      (Array.isArray(controllerPath)
        ? '(' + controllerPath.join(' || ') + ')'
        : controllerPath || '') +
      (Array.isArray(handlerPath)
        ? '(' + handlerPath.join(' || ') + ')'
        : handlerPath || '');

    const configuredCounter = this.counter.labels({ endpoint: fullPath });
    configuredCounter.inc();
    const timer = this.summary.startTimer({ endpoint: fullPath });
    return next.handle().pipe(
      tap(() => {
        timer({ code: res.statusCode });
        this.log.debug('Incoming request metrics collected');
      }),
    );
  }
}
