import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { DriverController } from './driver.controller';
import { Driver, DriverSchema } from './driver.schema';
import { DriverService } from './driver.service';
import { TruckModule } from '../truck/truck.module';
import { MONGO_CONNECTION_NAME } from '../utils/constants';

@Module({
  imports: [
    MongooseModule.forFeature(
      [{ name: Driver.name, schema: DriverSchema }],
      MONGO_CONNECTION_NAME,
    ),
    TruckModule,
  ],
  exports: [DriverService],
  controllers: [DriverController],
  providers: [DriverService],
})
export class DriverModule {}
