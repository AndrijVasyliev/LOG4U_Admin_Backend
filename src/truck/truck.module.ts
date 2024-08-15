import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TruckController } from './truck.controller';
import { Truck, TruckSchema } from './truck.schema';
import { TruckService } from './truck.service';
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
  providers: [TruckService],
})
export class TruckModule {}
