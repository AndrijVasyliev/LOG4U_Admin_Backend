import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TruckController } from './truck.controller';
import { Truck, TruckSchema } from './truck.schema';
import { TruckService } from './truck.service';
import { TruckWorkerService } from './truck.worker.service';
import { TruckJobService } from './truck.job.service';
import { GoogleGeoApiModule } from '../googleGeoApi/googleGeoApi.module';
import { MONGO_CONNECTION_NAME } from '../utils/constants';
import { PushModule } from '../push/push.module';

@Module({
  imports: [
    MongooseModule.forFeature(
      [{ name: Truck.name, schema: TruckSchema }],
      MONGO_CONNECTION_NAME,
    ),
    GoogleGeoApiModule,
    PushModule,
  ],
  exports: [TruckService],
  controllers: [TruckController],
  providers: [TruckService, TruckWorkerService, TruckJobService],
})
export class TruckModule {}
