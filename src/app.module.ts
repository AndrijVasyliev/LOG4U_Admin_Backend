import './utils/fixMongooseStringValidation';
import {
  Module,
  NestModule,
  MiddlewareConsumer,
  RequestMethod,
} from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PrometheusModule } from '@willsoto/nestjs-prometheus';
import { PromConfigService } from './prometheus/prometheus.config.service';
import { MongooseModule, MongooseModuleFactoryOptions } from '@nestjs/mongoose';
import { ServeStaticModule } from '@nestjs/serve-static';
import { Connection, Schema as MongooseSchema } from 'mongoose';
import * as mongoosePaginate from 'mongoose-paginate-v2';
import * as mongooseAutopopulate from 'mongoose-autopopulate';
import { DeleteField } from './utils/mongooseDeleteField';
import { join } from 'path';

import configuration from '../config/configuration';

import { MetricsController } from './metrics/metrics.controller';
import { HealthModule } from './health/health.module';
import { LoggerModule, LogLevel, LogFormat } from './logger';
import { ResponseTimeMiddleware } from './utils/responseTime.middleware';

import { PersonModule } from './person/person.module';
import { OwnerModule } from './owner/owner.module';
import { OwnerDriverModule } from './ownerDriver/ownerDriver.module';
import { CoordinatorModule } from './coordinator/coordinator.module';
import { CoordinatorDriverModule } from './coordinatorDriver/coordinatorDriver.module';
import { DriverModule } from './driver/driver.module';
import { UserModule } from './user/user.module';
import { LocationModule } from './location/location.module';
import { LoadModule } from './load/load.module';
import { TruckModule } from './truck/truck.module';
import { GoogleGeoApiModule } from './googleGeoApi/googleGeoApi.module';
import { MobileAppModule } from './mobileApp/mobileApp.module';
import { MobileAppController } from './mobileApp/mobileApp.controller';
import { AuthModule } from './auth/auth.module';
import { EmailModule } from './email/email.module';
import { PushModule } from './push/push.module';
import { MONGO_CONNECTION_NAME } from './utils/constants';

import { ChatModule } from './chat/chat.module';

@Module({
  imports: [
    AuthModule,
    LoggerModule.registerAsync({
      useFactory: async (config: ConfigService) => {
        return {
          level: config.get<LogLevel>('log.level') || 'verbose',
          format: config.get<LogFormat>('log.format') || 'string',
          serviceName: config.get<string>('app.serviceName') || '',
          requestIdFieldName: config.get<string>('log.requestIdFieldName') || 'requestId',
          forRoutes: [
            { path: '*', method: RequestMethod.ALL },
            MobileAppController,
          ],
        };
      },
      inject: [ConfigService],
    }),
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      load: [configuration],
    }),
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', '..', 'static'),
    }),
    HealthModule,
    GoogleGeoApiModule,
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      connectionName: MONGO_CONNECTION_NAME,
      useFactory: async (configService: ConfigService) => {
        return {
          ...configService.get<MongooseModuleFactoryOptions>('db'),
          connectionFactory: (connection: Connection): Connection => {
            connection
              .plugin(mongoosePaginate)
              .plugin(
                mongooseAutopopulate as unknown as (
                  schema: MongooseSchema,
                ) => void,
              )
              .plugin(DeleteField);
            return connection;
          },
        };
      },
      inject: [ConfigService],
    }),
    PrometheusModule.registerAsync({
      controller: MetricsController,
      imports: [ConfigModule],
      useClass: PromConfigService,
      inject: [ConfigService],
    }),
    PersonModule,
    OwnerModule,
    OwnerDriverModule,
    CoordinatorModule,
    CoordinatorDriverModule,
    DriverModule,
    UserModule,
    LocationModule,
    LoadModule,
    TruckModule,
    MobileAppModule,
    EmailModule,
    PushModule,
    ChatModule,
  ],
})
export class AppModule implements NestModule {
  public configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(ResponseTimeMiddleware)
      .forRoutes({ path: '*', method: RequestMethod.ALL }, MobileAppController);
  }
}
