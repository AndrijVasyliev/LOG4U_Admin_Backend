import { LogLevel as Level, MiddlewareConsumer } from '@nestjs/common';
export type LogLevel = Level;
export type LogFormat = 'string' | 'json';

export interface LoggerModuleOptions {
  level: Level;
  format: LogFormat;
  serviceName: string;
  forRoutes?: Parameters<ReturnType<MiddlewareConsumer['apply']>['forRoutes']>;
  exclude?: Parameters<ReturnType<MiddlewareConsumer['apply']>['exclude']>;
}
