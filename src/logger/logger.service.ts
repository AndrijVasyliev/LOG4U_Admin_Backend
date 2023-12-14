import * as os from 'node:os';
import {
  Injectable,
  LoggerService as BaseLoggerService,
  LogLevel,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { isEmpty } from 'ramda';
import * as rTracer from 'cls-rtracer';
import {
  Logger as winstonLogger,
  transports,
  format,
  createLogger,
} from 'winston';

const hostname = os.hostname();
const { combine, printf, colorize, splat, errors } = format;

type Meta = Record<string, any>;

@Injectable()
export class LoggerService implements BaseLoggerService {
  private readonly logger: winstonLogger;
  readonly logLevel: LogLevel;
  readonly serviceName: string;
  readonly logFormat: string;

  private injectRequestId = (meta?: Meta): Meta => {
    const newMeta: Meta = meta ? meta : {};
    const traceId = rTracer.id();
    if (traceId) {
      newMeta.requestId = traceId;
    }
    newMeta.timestamp = new Date();
    return newMeta;
  };

  private logJsonFormat = printf((info: object): string =>
    JSON.stringify({ ...info, hostname, servicename: this.serviceName }),
  );

  private logStringFormat = printf((info): string => {
    const {
      level,
      stack,
      context,
      message,
      timestamp: timeStamp,
      requestId,
      ...metadata
    } = info;
    let log = `${(timeStamp || new Date())
      .toJSON()
      .replace('T', ' ')
      .substring(0, 19)} [${level}]${context ? ' (' + context + ')' : ''} ${
      requestId || ''
    }: ${message}`;
    if (!isEmpty(metadata)) {
      log += `${JSON.stringify(metadata)}`;
    }
    return stack ? `${log} stack: ${stack.replace(/\n/g, ' ')}` : log;
  });

  private json = format((info) => {
    const messageType = typeof info.message;
    if (messageType === 'object' && !isEmpty(info.message)) {
      // eslint-disable-next-line no-param-reassign
      info.message = Object.entries(info.message)
        .map(
          ([key, value]) =>
            `${key}: ${
              typeof value === 'string' ? value : JSON.stringify(value)
            }`,
        )
        .join(this.logFormat === 'string' ? '; ' : ';\n');
    } else if (messageType !== 'string') {
      // eslint-disable-next-line no-param-reassign
      info.message = JSON.stringify(info.message, null, 0);
    }
    // eslint-disable-next-line no-param-reassign
    info.message =
      info.message && typeof info.message === 'object'
        ? JSON.stringify(info.message, null, 0)
        : info.message;
    return info;
  });

  constructor(private configService: ConfigService) {
    this.logLevel = configService.get<LogLevel>('log.level') as LogLevel;
    this.serviceName = configService.get<string>('app.serviceName') as string;
    this.logFormat = configService.get<string>('log.format') as string;
    this.logger = createLogger({
      level: this.logLevel,
      transports: [
        new transports.Console({
          level: this.logLevel,
          format:
            this.logFormat === 'string'
              ? format.combine(colorize(), this.logStringFormat)
              : combine(this.logJsonFormat),
          handleExceptions: true,
          handleRejections: true,
        }),
      ],
      format: combine(splat(), errors({ stack: true }), this.json()),
      exitOnError: true,
    });
  }

  public error(message: string, error?: any, context?: string): void;
  public error(message: any, meta?: Meta): void;

  public error(message: any, arg?: Meta, context?: string): void {
    const newMeta =
      !context && arg && typeof arg === 'object' ? arg : { context };
    this.logger.error(message, this.injectRequestId(newMeta));
  }
  public warn(message: any, meta?: Meta): void {
    this.logger.warn(message, this.injectRequestId(meta));
  }
  public info(message: any, meta?: Meta): void {
    this.logger.info(message, this.injectRequestId(meta));
  }
  public http(message: any, meta?: Meta): void {
    this.logger.http(message, this.injectRequestId(meta));
  }
  public verbose(message: any, meta?: Meta): void {
    this.logger.verbose(message, this.injectRequestId(meta));
  }
  public debug(message: any, meta?: Meta): void {
    this.logger.debug(message, this.injectRequestId(meta));
  }
  public silly(message: any, meta?: Meta): void {
    this.logger.silly(message, this.injectRequestId(meta));
  }

  public log(message: any, context: string): void {
    this.logger.log('info', message, { context });
  }
}
