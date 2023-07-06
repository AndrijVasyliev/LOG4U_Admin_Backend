import { hostname } from 'node:os';
import { Injectable } from '@nestjs/common';
import {
  PrometheusOptionsFactory,
  PrometheusOptions,
} from '@willsoto/nestjs-prometheus';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class PromConfigService implements PrometheusOptionsFactory {
  constructor(private configService: ConfigService) {}

  createPrometheusOptions(): PrometheusOptions {
    return {
      defaultMetrics: {
        enabled: true,
        config: {
          prefix: this.configService.get<string>('app.serviceName') + '_',
        },
      },
      defaultLabels: { hostname: hostname() },
    };
  }
}
