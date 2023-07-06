import './utils/fixMongooseStringValidation';
import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PrometheusModule } from '@willsoto/nestjs-prometheus';
import { PromConfigService } from './prometheus/prometheus.config.service';
// import { MongooseModule } from '@nestjs/mongoose';

import { AppController } from './app.controller';
import { AppService } from './app.service';

import configuration from '../config/configuration';

import { HealthModule } from './health/health.module';
import { HealthController } from './health/health.controller';
import { LoggerModule } from './logger/logger.module';
import { LoggerMiddleware } from './logger/logger.middleware';
import { ResponseTimeMiddleware } from './utils/responseTime.middleware';
import { RequestIdMiddleware } from './utils/requestId.middleware';

@Module({
  imports: [
    LoggerModule,
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      load: [configuration],
    }),
    HealthModule,
    /*MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        return {
          uri: configService.get<string>('db.uri'),
        };
      },
      inject: [ConfigService],
    }),*/
    PrometheusModule.registerAsync({
      imports: [ConfigModule],
      useClass: PromConfigService,
      inject: [ConfigService],
    }),
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
      );
    consumer
      .apply(LoggerMiddleware)
      .forRoutes(
        AppController,
        HealthController,
      );
    consumer
      .apply(ResponseTimeMiddleware)
      .forRoutes(
        AppController,
        HealthController,
      );
  }
}
