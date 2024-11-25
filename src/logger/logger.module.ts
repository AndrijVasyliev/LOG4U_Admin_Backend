import * as os from 'node:os';
import {
  Global,
  Inject,
  MiddlewareConsumer,
  Module,
  NestModule,
} from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import * as DefaultLogger from 'winston';
import { stringify } from 'safe-stable-stringify';
import { cyan, grey } from 'colors/safe';
import { LoggerService, NestLoggerService } from './logger.service';
import {
  ConfigurableModuleClass,
  MODULE_OPTIONS_TOKEN,
} from './logger.module-definition';
import { LoggerModuleOptions } from './logger.interface';
import { RequestIdMiddleware } from './requestId.middleware';
import { RequestResponseLoggerMiddleware } from './requestResponseLogger.middleware';
import { LoggerExceptionFilter } from './logger.exception.filter';
import { replacer } from './logger.replacer.util';
import { REQUEST_ID, CONTEXT, STACK } from './logger.constants.util';

const { format, transports } = DefaultLogger;
const hostName = os.hostname();
const { combine, printf, colorize, timestamp, splat, errors } = format;

@Global()
@Module({
  providers: [
    LoggerService,
    NestLoggerService,
    {
      provide: APP_FILTER,
      useClass: LoggerExceptionFilter,
    },
  ],
  exports: [LoggerService, NestLoggerService, MODULE_OPTIONS_TOKEN],
})
export class LoggerModule
  extends ConfigurableModuleClass
  implements NestModule
{
  private readonly requestIdFieldName: string = 'requestId';
  private logJsonFormat = printf(
    (info) =>
      stringify(
        {
          ...info,
          [this.requestIdFieldName]: info[REQUEST_ID],
          context: info[CONTEXT] || info.context,
          stack: ((info[STACK] || info.stack) as string)?.split('\n'),
          hostName,
          serviceName: this.options.serviceName,
        },
        replacer,
      ) || '',
  );

  private logStringFormat = printf((info): string => {
    const { level, message, timestamp, ...metadata } = info;
    let log = `${(timestamp as string || new Date().toJSON())
      .replace('T', ' ')
      .substring(
        0,
        19,
      )} [${level}]${grey(info[CONTEXT] ? ' (' + info[CONTEXT] + ')' : '')} ${cyan(info[REQUEST_ID] as string || '')}: ${message}`;
    if (Object.keys(metadata).length) {
      log += ` ${stringify(metadata, replacer)}`;
    }
    return info[STACK] || info.stack
      ? `${log} \nStack: ${info[STACK] || info.stack}`
      : log;
  });

  constructor(
    @Inject(MODULE_OPTIONS_TOKEN) private readonly options: LoggerModuleOptions,
  ) {
    super();
    if (this.options.requestIdFieldName) {
      this.requestIdFieldName = this.options.requestIdFieldName;
    }
    DefaultLogger.configure({
      level: this.options.level,
      transports: [
        new transports.Console({
          level: this.options.level,
          format:
            this.options.format === 'string'
              ? format.combine(colorize(), this.logStringFormat)
              : combine(this.logJsonFormat),
          handleExceptions: true,
          handleRejections: true,
        }),
      ],
      format: combine(
        timestamp(),
        errors({ stack: true, cause: true }),
        splat(),
      ),
      exitOnError: true,
    });
  }

  configure(consumer: MiddlewareConsumer): any {
    const configProxy = consumer.apply(
      RequestIdMiddleware,
      RequestResponseLoggerMiddleware,
    );

    if (this.options.forRoutes) {
      configProxy.forRoutes(...this.options.forRoutes);
    } else {
      configProxy.forRoutes('*');
    }

    if (this.options.exclude) {
      configProxy.exclude(...this.options.exclude);
    }
  }
}
