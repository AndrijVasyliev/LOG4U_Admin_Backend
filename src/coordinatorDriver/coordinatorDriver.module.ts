import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CoordinatorDriverController } from './coordinatorDriver.controller';
import {
  CoordinatorDriver,
  CoordinatorDriverSchema,
} from './coordinatorDriver.schema';
import { CoordinatorDriverService } from './coordinatorDriver.service';
import { TruckModule } from '../truck/truck.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: CoordinatorDriver.name, schema: CoordinatorDriverSchema },
    ]),
    TruckModule,
  ],
  exports: [CoordinatorDriverService],
  controllers: [CoordinatorDriverController],
  providers: [CoordinatorDriverService],
})
export class CoordinatorDriverModule {}
