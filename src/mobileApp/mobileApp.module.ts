import { Module } from '@nestjs/common';
import { MobileAppController } from './mobileApp.controller';
import { PersonModule } from '../person/person.module';
import { DriverModule } from '../driver/driver.module';
import { OwnerModule } from '../owner/owner.module';
import { CoordinatorModule } from '../coordinator/coordinator.module';
import { LoadModule } from '../load/load.module';
import { TruckModule } from '../truck/truck.module';

@Module({
  imports: [
    LoadModule,
    TruckModule,
    DriverModule,
    OwnerModule,
    CoordinatorModule,
    PersonModule,
  ],
  exports: [],
  controllers: [MobileAppController],
  providers: [],
})
export class MobileAppModule {}
