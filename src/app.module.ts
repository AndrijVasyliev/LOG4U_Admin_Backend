import './utils/fixMongooseStringValidation';
import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
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
import { AuthModule } from './auth/auth.module';
import { EmailModule } from './email/email.module';
import { PushModule } from './push/push.module';
import { FileModule } from './file/file.module';

import { CoordinatorController } from './coordinator/coordinator.controller';
import { CoordinatorDriverController } from './coordinatorDriver/coordinatorDriver.controller';
import { DriverController } from './driver/driver.controller';
import { EmailController } from './email/email.controller';
import { FileController } from './file/file.controller';
import { HealthController } from './health/health.controller';
import { LoadController } from './load/load.controller';
import { LocationController } from './location/location.controller';
import { MetricsController } from './metrics/metrics.controller';
import { MobileAppController } from './mobileApp/mobileApp.controller';
import { OwnerController } from './owner/owner.controller';
import { OwnerDriverController } from './ownerDriver/ownerDriver.controller';
import { PersonController } from './person/person.controller';
import { PushController } from './push/push.controller';
import { TruckController } from './truck/truck.controller';
import { UserController } from './user/user.controller';

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
          requestIdFieldName:
            config.get<string>('log.requestIdFieldName') || 'requestId',
          forRoutes: [
            // { path: '*', method: RequestMethod.ALL },
            CoordinatorController,
            CoordinatorDriverController,
            DriverController,
            EmailController,
            FileController,
            HealthController,
            LoadController,
            MetricsController,
            LocationController,
            MobileAppController,
            OwnerController,
            OwnerDriverController,
            PersonController,
            PushController,
            TruckController,
            UserController,
          ],
          // exclude: ['file*'],
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
    FileModule,
    ChatModule,
  ],
})
export class AppModule implements NestModule {
  public configure(consumer: MiddlewareConsumer) {
    consumer.apply(ResponseTimeMiddleware).forRoutes(
      // { path: '*', method: RequestMethod.ALL },
      CoordinatorController,
      CoordinatorDriverController,
      DriverController,
      EmailController,
      FileController,
      HealthController,
      LoadController,
      MetricsController,
      LocationController,
      MobileAppController,
      OwnerController,
      OwnerDriverController,
      PersonController,
      PushController,
      TruckController,
      UserController,
    );
  }
}
