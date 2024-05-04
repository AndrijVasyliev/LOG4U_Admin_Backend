import { hostname } from 'node:os';
import { Injectable, Scope } from '@nestjs/common';
import {
  PrometheusOptions,
  PrometheusOptionsFactory,
} from '@willsoto/nestjs-prometheus';
import { ConfigService } from '@nestjs/config';

@Injectable({ scope: Scope.TRANSIENT })
export class PromConfigService implements PrometheusOptionsFactory {
  constructor(private readonly configService: ConfigService) {}

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
