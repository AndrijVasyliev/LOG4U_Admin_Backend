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

import { AppController } from './app.controller';
import { AppService } from './app.service';

import configuration from '../config/configuration';

import { MetricsController } from './metrics/metrics.controller';
import { HealthModule } from './health/health.module';
import { LoggerModule } from './logger/logger.module';
import { LoggerMiddleware } from './logger/logger.middleware';
import { ResponseTimeMiddleware } from './utils/responseTime.middleware';
import { RequestIdMiddleware } from './utils/requestId.middleware';

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
import { MONGO_CONNECTION_NAME } from './utils/constants';

@Module({
  imports: [
    AuthModule,
    LoggerModule,
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
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements NestModule {
  public configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(RequestIdMiddleware, LoggerMiddleware, ResponseTimeMiddleware)
      .forRoutes('*');
  }
}
