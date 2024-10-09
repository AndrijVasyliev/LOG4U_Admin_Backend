import { Injectable, Scope } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { getConnectionToken } from '@nestjs/mongoose';
import { connection as MongoConnection } from 'mongoose';
import {
  HealthIndicator,
  HealthIndicatorResult,
  MongoosePingCheckSettings,
  ConnectionNotFoundError,
  TimeoutError,
  HealthCheckError,
} from '@nestjs/terminus';

type Connection = typeof MongoConnection;

class PromiseTimeoutError extends Error {}

const promiseTimeout = function (
  ms: number,
  promise: Promise<any>,
): Promise<any> {
  let timer: NodeJS.Timeout;
  return Promise.race([
    promise,
    new Promise(
      (_, reject) =>
        (timer = setTimeout(
          () => reject(new PromiseTimeoutError(`Timed out in ${ms}ms.`)),
          ms,
        )),
    ),
  ]).finally(() => clearTimeout(timer));
};

@Injectable({ scope: Scope.TRANSIENT })
export class MongooseHealthIndicator extends HealthIndicator {
  constructor(private moduleRef: ModuleRef) {
    super();
  }

  private getContextConnection(): Connection | null {
    try {
      return this.moduleRef.get(
        getConnectionToken('DatabaseConnection') as string,
        {
          strict: false,
        },
      ) as Connection;
    } catch (err) {
      return null;
    }
  }

  private async pingDb(connection: Connection, timeout: number) {
    if (!connection.db) {
      return;
    }
    const promise = connection.db.admin().ping();
    return await promiseTimeout(timeout, promise);
  }

  public async pingCheck(
    key: string,
    options: MongoosePingCheckSettings = {},
  ): Promise<HealthIndicatorResult> {
    let isHealthy = false;

    const connection: Connection =
      (options.connection as Connection) || this.getContextConnection();
    const timeout = options.timeout || 1000;

    if (!connection) {
      throw new ConnectionNotFoundError(
        this.getStatus(key, isHealthy, {
          message: 'Connection provider not found in application context',
        }),
      );
    }

    try {
      await this.pingDb(connection, timeout);
      isHealthy = true;
    } catch (err) {
      if (err instanceof PromiseTimeoutError) {
        throw new TimeoutError(
          timeout,
          this.getStatus(key, isHealthy, {
            message: `timeout of ${timeout}ms exceeded`,
          }),
        );
      }
    }

    if (isHealthy) {
      return this.getStatus(key, isHealthy);
    } else {
      throw new HealthCheckError(
        `${key} is not available`,
        this.getStatus(key, isHealthy),
      );
    }
  }
}
