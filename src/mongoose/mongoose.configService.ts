import { EventEmitter } from 'node:events';
import { Injectable, Scope } from '@nestjs/common';
import {
  MongooseOptionsFactory,
  MongooseModuleOptions,
  MongooseModuleFactoryOptions,
} from '@nestjs/mongoose';
import { InjectMetric } from '@willsoto/nestjs-prometheus';
import { ConfigService } from '@nestjs/config';
import { Connection, Schema as MongooseSchema } from 'mongoose';
import * as mongoosePaginate from 'mongoose-paginate-v2';
import * as mongooseAutopopulate from 'mongoose-autopopulate';
import { Gauge } from 'prom-client';
import { DeleteField } from '../utils/mongooseDeleteField';

@Injectable({ scope: Scope.TRANSIENT })
export class MongooseConfigService implements MongooseOptionsFactory {
  constructor(
    private readonly configService: ConfigService,
    @InjectMetric('mongo_connections') private readonly gauge: Gauge<string>,
  ) {}

  createMongooseOptions():
    | Promise<MongooseModuleOptions>
    | MongooseModuleOptions {
    return {
      ...this.configService.get<MongooseModuleFactoryOptions>('db'),
      lazyConnection: true,
      connectionFactory: (
        connection: Connection & { client: EventEmitter },
      ): Promise<Connection> => {
        connection.client.on(
          'connectionReady',
          (event: { address: string }) => {
            this.gauge.inc({ address: event.address });
          },
        );
        connection.client.on(
          'connectionClosed',
          (event: { address: string }) => {
            this.gauge.dec({ address: event.address });
          },
        );
        connection
          .plugin(mongoosePaginate)
          .plugin(
            mongooseAutopopulate as unknown as (schema: MongooseSchema) => void,
          )
          .plugin(DeleteField);
        return connection.asPromise();
      },
    };
  }
}
