import './utils/fixMongooseStringValidation';
import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PrometheusModule } from '@willsoto/nestjs-prometheus';
import { PromConfigService } from './prometheus/prometheus.config.service';
import { MongooseModule } from '@nestjs/mongoose';

import { AppController } from './app.controller';
import { AppService } from './app.service';

import configuration from '../config/configuration';

import { HealthModule } from './health/health.module';
import { HealthController } from './health/health.controller';
import { LoggerModule } from './logger/logger.module';
import { LoggerMiddleware } from './logger/logger.middleware';
import { ResponseTimeMiddleware } from './utils/responseTime.middleware';
import { RequestIdMiddleware } from './utils/requestId.middleware';

import { OwnerController } from './owner/owner.controller';
import { OwnerModule } from './owner/owner.module';
import { CoordinatorController } from './coordinator/coordinator.controller';
import { CoordinatorModule } from './coordinator/coordinator.module';
import { DriverController } from './driver/driver.controller';
import { DriverModule } from './driver/driver.module';

@Module({
  imports: [
    LoggerModule,
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      load: [configuration],
    }),
    HealthModule,
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        return {
          uri: configService.get<string>('db.uri'),
        };
      },
      inject: [ConfigService],
    }),
    PrometheusModule.registerAsync({
      imports: [ConfigModule],
      useClass: PromConfigService,
      inject: [ConfigService],
    }),
    OwnerModule,
    CoordinatorModule,
    DriverModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements NestModule {
  public configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(RequestIdMiddleware)
      .forRoutes(
        AppController,
        HealthController,
        OwnerController,
        CoordinatorController,
        DriverController,
      );
    consumer
      .apply(LoggerMiddleware)
      .forRoutes(
        AppController,
        HealthController,
        OwnerController,
        CoordinatorController,
        DriverController,
      );
    consumer
      .apply(ResponseTimeMiddleware)
      .forRoutes(
        AppController,
        HealthController,
        OwnerController,
        CoordinatorController,
        DriverController,
      );
  }
}
