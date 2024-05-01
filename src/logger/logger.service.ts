import {
  Injectable,
  Inject,
  Scope,
  LoggerService as LoggerServiceInterface,
} from '@nestjs/common';
import { INQUIRER } from '@nestjs/core';
import * as rTracer from 'cls-rtracer';
import * as DefaultLogger from 'winston';
import { stringify } from 'safe-stable-stringify';
import { replacer } from './logger.replacer.util';
import { REQUEST_ID, CONTEXT, STACK } from './logger.constants.util';

type Meta = Record<string | symbol, any>;
const injectRequestId = (): Meta => {
  const newMeta: Meta = {};
  const traceId = rTracer.id();
  if (traceId) {
    newMeta[REQUEST_ID] = traceId;
  }
  return newMeta;
};
const isString = (val: any): val is string => typeof val === 'string';
export const isUndefined = (obj: any): obj is undefined =>
  typeof obj === 'undefined';

@Injectable({ scope: Scope.TRANSIENT })
export class LoggerService implements LoggerServiceInterface {
  private readonly logger: typeof DefaultLogger;
  private readonly context: string;

  constructor(@Inject(INQUIRER) private parentClass: object) {
    this.logger = DefaultLogger;
    this.context = parentClass?.constructor?.name || '';
  }
  public error(message: string, ...optionalParams: any[]): void;
  public error(message: Error): void;
  public error(message: any, ...optionalParams: any[]): void {
    if (message instanceof Error)
      return void this.logger.error(
        message as unknown as string,
        { [CONTEXT]: this.context },
        injectRequestId(),
      );
    return void this.logger.error(
      message,
      ...[...optionalParams, { [CONTEXT]: this.context }, injectRequestId()],
    );
  }
  public warn(message: string, ...optionalParams: any[]): void;
  public warn(message: Error): void;
  public warn(message: any, ...optionalParams: any[]): void {
    if (message instanceof Error)
      return void this.logger.warn(
        message as unknown as string,
        { [CONTEXT]: this.context },
        injectRequestId(),
      );
    return void this.logger.warn(
      message,
      ...[...optionalParams, { [CONTEXT]: this.context }, injectRequestId()],
    );
  }
  public info(message: string, ...optionalParams: any[]): void;
  public info(message: Error): void;
  public info(message: any, ...optionalParams: any[]): void {
    if (message instanceof Error)
      return void this.logger.info(
        message as unknown as string,
        { [CONTEXT]: this.context },
        injectRequestId(),
      );
    return void this.logger.info(
      message,
      ...[...optionalParams, { [CONTEXT]: this.context }, injectRequestId()],
    );
  }
  public http(message: string, ...optionalParams: any[]): void;
  public http(message: Error): void;
  public http(message: any, ...optionalParams: any[]): void {
    if (message instanceof Error)
      return void this.logger.http(
        message as unknown as string,
        { [CONTEXT]: this.context },
        injectRequestId(),
      );
    return void this.logger.http(
      message,
      ...[...optionalParams, { [CONTEXT]: this.context }, injectRequestId()],
    );
  }
  public verbose(message: string, ...optionalParams: any[]): void;
  public verbose(message: Error): void;
  public verbose(message: any, ...optionalParams: any[]): void {
    if (message instanceof Error)
      return void this.logger.verbose(
        message as unknown as string,
        { [CONTEXT]: this.context },
        injectRequestId(),
      );
    return void this.logger.verbose(
      message,
      ...[...optionalParams, { [CONTEXT]: this.context }, injectRequestId()],
    );
  }
  public debug(message: string, ...optionalParams: any[]): void;
  public debug(message: Error): void;
  public debug(message: any, ...optionalParams: any[]): void {
    if (message instanceof Error)
      return void this.logger.debug(
        message as unknown as string,
        { [CONTEXT]: this.context },
        injectRequestId(),
      );
    return void this.logger.debug(
      message,
      ...[...optionalParams, { [CONTEXT]: this.context }, injectRequestId()],
    );
  }
  public silly(message: string, ...optionalParams: any[]): void;
  public silly(message: Error): void;
  public silly(message: any, ...optionalParams: any[]): void {
    if (message instanceof Error)
      return void this.logger.silly(
        message as unknown as string,
        { [CONTEXT]: this.context },
        injectRequestId(),
      );
    return void this.logger.silly(
      message,
      ...[...optionalParams, { [CONTEXT]: this.context }, injectRequestId()],
    );
  }

  public log(message: string, ...optionalParams: any[]): void;
  public log(message: Error): void;
  public log(message: any, ...optionalParams: any[]): void {
    if (message instanceof Error)
      return void this.logger.log(
        message as unknown as string,
        injectRequestId(),
      );
    return void this.logger.log(
      'info',
      message,
      ...[...optionalParams, { [CONTEXT]: this.context }, injectRequestId()],
    );
  }
}

@Injectable()
export class NestLoggerService implements LoggerServiceInterface {
  private readonly logger: typeof DefaultLogger;

  private isStackFormat(stack: unknown) {
    if (!isString(stack) && !isUndefined(stack)) {
      return false;
    }

    return /^(.)+\n\s+at .+:\d+:\d+$/.test(<string>stack);
  }
  private getContextAndMessages(args: unknown[]) {
    if (args?.length <= 1) {
      return { messages: args };
    }
    const lastElement = args[args.length - 1];
    const isContext = isString(lastElement);
    if (!isContext) {
      return { messages: args };
    }
    return {
      context: lastElement as string,
      messages: args.slice(0, args.length - 1),
    };
  }

  private getContextAndStackAndMessages(args: unknown[]) {
    if (args.length === 2) {
      return this.isStackFormat(args[1])
        ? {
            messages: [args[0]],
            stack: args[1] as string,
          }
        : {
            messages: [args[0]],
            context: args[1] as string,
          };
    }

    const { messages, context } = this.getContextAndMessages(args);
    if (messages?.length <= 1) {
      return { messages, context };
    }
    const lastElement = messages[messages.length - 1];
    const isStack = isString(lastElement);
    if (!isStack && !isUndefined(lastElement)) {
      return { messages, context };
    }
    return {
      stack: lastElement as string,
      messages: messages.slice(0, messages.length - 1),
      context,
    };
  }

  constructor() {
    this.logger = DefaultLogger;
  }
  error(message: any, stack?: string, context?: string): void;
  error(message: any, ...optionalParams: [...any, string?, string?]): void;
  error(message: any, ...optionalParams: any[]) {
    const { messages, context, stack } = this.getContextAndStackAndMessages([
      message,
      ...optionalParams,
    ]);
    messages.forEach((message) =>
      this.logger.log(
        'error',
        typeof message === 'string'
          ? message
          : (stringify(message, replacer) as string),
        {
          [STACK]: stack,
          [CONTEXT]: context,
          ...injectRequestId(),
        },
      ),
    );
  }
  log(message: any, context?: string): void;
  log(message: any, ...optionalParams: [...any, string?]): void;
  log(message: any, ...optionalParams: any[]) {
    const { messages, context } = this.getContextAndMessages([
      message,
      ...optionalParams,
    ]);
    messages.forEach((message) =>
      this.logger.log(
        'info',
        typeof message === 'string'
          ? message
          : (stringify(message, replacer) as string),
        {
          [CONTEXT]: context,
          ...injectRequestId(),
        },
      ),
    );
  }
  warn(message: any, context?: string): void;
  warn(message: any, ...optionalParams: [...any, string?]): void;
  warn(message: any, ...optionalParams: any[]) {
    const { messages, context } = this.getContextAndMessages([
      message,
      ...optionalParams,
    ]);
    messages.forEach((message) =>
      this.logger.log(
        'warn',
        typeof message === 'string'
          ? message
          : (stringify(message, replacer) as string),
        {
          [CONTEXT]: context,
          ...injectRequestId(),
        },
      ),
    );
  }
  debug(message: any, context?: string): void;
  debug(message: any, ...optionalParams: [...any, string?]): void;
  debug(message: any, ...optionalParams: any[]) {
    const { messages, context } = this.getContextAndMessages([
      message,
      ...optionalParams,
    ]);
    messages.forEach((message) =>
      this.logger.log(
        'debug',
        typeof message === 'string'
          ? message
          : (stringify(message, replacer) as string),
        {
          [CONTEXT]: context,
          ...injectRequestId(),
        },
      ),
    );
  }
  verbose(message: any, context?: string): void;
  verbose(message: any, ...optionalParams: [...any, string?]): void;
  verbose(message: any, ...optionalParams: any[]) {
    const { messages, context } = this.getContextAndMessages([
      message,
      ...optionalParams,
    ]);
    messages.forEach((message) =>
      this.logger.log(
        'verbose',
        typeof message === 'string'
          ? message
          : (stringify(message, replacer) as string),
        {
          [CONTEXT]: context,
          ...injectRequestId(),
        },
      ),
    );
  }
  fatal(message: any, context?: string): void;
  fatal(message: any, ...optionalParams: [...any, string?]): void;
  fatal(message: any, ...optionalParams: any[]) {
    const { messages, context } = this.getContextAndMessages([
      message,
      ...optionalParams,
    ]);
    messages.forEach((message) =>
      this.logger.log(
        'error',
        typeof message === 'string'
          ? message
          : (stringify(message, replacer) as string),
        {
          [CONTEXT]: context,
          ...injectRequestId(),
        },
      ),
    );
  }
}
