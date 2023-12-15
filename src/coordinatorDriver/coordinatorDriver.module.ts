import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CoordinatorDriverController } from './coordinatorDriver.controller';
import {
  CoordinatorDriver,
  CoordinatorDriverSchema,
} from './coordinatorDriver.schema';
import { CoordinatorDriverService } from './coordinatorDriver.service';
import { TruckModule } from '../truck/truck.module';
import { MONGO_CONNECTION_NAME } from '../utils/constants';

@Module({
  imports: [
    MongooseModule.forFeature(
      [{ name: CoordinatorDriver.name, schema: CoordinatorDriverSchema }],
      MONGO_CONNECTION_NAME,
    ),
    TruckModule,
  ],
  exports: [CoordinatorDriverService],
  controllers: [CoordinatorDriverController],
  providers: [CoordinatorDriverService],
})
export class CoordinatorDriverModule {}
