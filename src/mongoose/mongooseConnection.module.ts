import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { getToken, makeGaugeProvider } from '@willsoto/nestjs-prometheus';
import { MongooseConfigService } from './mongoose.configService';
import { MONGO_CONNECTION_NAME, MONGO_CONNECTIONS_METRIC_TOKEN } from '../utils/constants';
// import { MetricsModule } from '../metrics/metrics.module';
import { APP_FILTER } from '@nestjs/core';
import { MongoExceptionFilter } from './mongoose.exception.filter';

@Module({
  imports: [
    // MetricsModule,
    MongooseModule.forRootAsync({
      imports: [MongooseConnectionModule],
      connectionName: MONGO_CONNECTION_NAME,
      useClass: MongooseConfigService,
    }),
  ],
  providers: [
    makeGaugeProvider({
      name: MONGO_CONNECTIONS_METRIC_TOKEN,
      help: 'current connections in connections pool',
      labelNames: ['address'],
    }),
    {
      provide: APP_FILTER,
      useClass: MongoExceptionFilter,
    },
  ],
  exports: [getToken(MONGO_CONNECTIONS_METRIC_TOKEN)],
})
export class MongooseConnectionModule {}
