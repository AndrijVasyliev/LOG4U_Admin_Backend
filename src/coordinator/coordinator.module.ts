import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CoordinatorController } from './coordinator.controller';
import { Coordinator, CoordinatorSchema } from './coordinator.schema';
import { CoordinatorService } from './coordinator.service';
import { TruckModule } from '../truck/truck.module';
import { MONGO_CONNECTION_NAME } from '../utils/constants';

@Module({
  imports: [
    MongooseModule.forFeature(
      [{ name: Coordinator.name, schema: CoordinatorSchema }],
      MONGO_CONNECTION_NAME,
    ),
    TruckModule,
  ],
  exports: [CoordinatorService],
  controllers: [CoordinatorController],
  providers: [CoordinatorService],
})
export class CoordinatorModule {}
