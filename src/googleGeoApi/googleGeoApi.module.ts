import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { GoogleGeoApiService } from './googleGeoApi.service';

@Module({
  imports: [HttpModule],
  exports: [GoogleGeoApiService],
  controllers: [],
  providers: [GoogleGeoApiService],
})
export class GoogleGeoApiModule {}
