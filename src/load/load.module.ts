import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { LoadController } from './load.controller';
import { Load, LoadSchema } from './load.schema';
import { LoadService } from './load.service';
import { LoadWorkerService } from './load.worker.service';
import { TruckModule } from '../truck/truck.module';
import { GoogleGeoApiModule } from '../googleGeoApi/googleGeoApi.module';
import { MONGO_CONNECTION_NAME } from '../utils/constants';
import { PushModule } from '../push/push.module';

@Module({
  imports: [
    MongooseModule.forFeature(
      [{ name: Load.name, schema: LoadSchema }],
      MONGO_CONNECTION_NAME,
    ),
    TruckModule,
    GoogleGeoApiModule,
    PushModule,
  ],
  exports: [LoadService],
  controllers: [LoadController],
  providers: [LoadService, LoadWorkerService],
})
export class LoadModule {}
