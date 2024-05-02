import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import {
  PrometheusModule,
  makeCounterProvider,
  makeSummaryProvider,
} from '@willsoto/nestjs-prometheus';
import { MetricsController } from './metrics.controller';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PromConfigService } from '../prometheus/prometheus.config.service';
import { MetricsInterceptor } from './metrics.interceptor';

@Module({
  imports: [
    PrometheusModule.registerAsync({
      controller: MetricsController,
      imports: [ConfigModule],
      useClass: PromConfigService,
      inject: [ConfigService],
    }),
  ],
  providers: [
    makeCounterProvider({
      name: 'incoming_requests',
      help: 'count_incoming_requests_by_routes',
      labelNames: ['endpoint'],
    }),
    makeSummaryProvider({
      name: 'incoming_requests_duration',
      help: 'statistics_of_incoming_requests_process_time',
      labelNames: ['endpoint', 'code'],
    }),
    {
      provide: APP_INTERCEPTOR,
      useClass: MetricsInterceptor,
    },
  ],
  exports: [PrometheusModule],
})
export class MetricsModule {}
