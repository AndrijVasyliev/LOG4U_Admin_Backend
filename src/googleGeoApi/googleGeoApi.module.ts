import { Module } from '@nestjs/common';
import { makeCounterProvider } from '@willsoto/nestjs-prometheus';
import { HttpModule } from '@nestjs/axios';
import { MetricsModule } from '../metrics/metrics.module';
import { GoogleGeoApiService } from './googleGeoApi.service';

@Module({
  imports: [HttpModule, MetricsModule],
  exports: [GoogleGeoApiService],
  controllers: [],
  providers: [
    GoogleGeoApiService,
    makeCounterProvider({
      name: 'outgoing_google_geo_requests',
      help: 'count outgoing google geoapi requests by types',
      labelNames: ['type', 'code', 'status'],
    }),
  ],
})
export class GoogleGeoApiModule {}
