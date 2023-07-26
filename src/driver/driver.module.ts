import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { DriverController } from './driver.controller';
import { Driver, DriverSchema } from './driver.schema';
import { DriverService } from './driver.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Driver.name, schema: DriverSchema }]),
  ],
  exports: [DriverService],
  controllers: [DriverController],
  providers: [DriverService],
})
export class DriverModule {}
