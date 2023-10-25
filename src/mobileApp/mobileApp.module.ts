import { Module } from '@nestjs/common';
import { MobileAppController } from './mobileApp.controller';
import { LoadModule } from '../load/load.module';
import { TruckModule } from '../truck/truck.module';

@Module({
  imports: [LoadModule, TruckModule],
  exports: [],
  controllers: [MobileAppController],
  providers: [],
})
export class MobileAppModule {}
