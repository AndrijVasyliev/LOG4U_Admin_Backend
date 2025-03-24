import { MiddlewareConsumer } from '@nestjs/common';
export type LogLevel = 'silly' | 'debug' | 'verbose' | 'http' | 'info' | 'warn' | 'error';
export type LogFormat = 'string' | 'json';

export interface LoggerModuleOptions {
  level: LogLevel;
  format: LogFormat;
  serviceName: string;
  requestIdFieldName?: string;
  forRoutes?: Parameters<ReturnType<MiddlewareConsumer['apply']>['forRoutes']>;
  exclude?: Parameters<ReturnType<MiddlewareConsumer['apply']>['exclude']>;
}
