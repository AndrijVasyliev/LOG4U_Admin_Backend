import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { LoadController } from './load.controller';
import { Load, LoadSchema } from './load.schema';
import { LoadService } from './load.service';
import { TruckModule } from '../truck/truck.module';
import { LocationModule } from '../location/location.module';
import { GoogleGeoApiModule } from '../googleGeoApi/googleGeoApi.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Load.name, schema: LoadSchema }]),
    TruckModule,
    LocationModule,
    GoogleGeoApiModule,
  ],
  exports: [LoadService],
  controllers: [LoadController],
  providers: [LoadService],
})
export class LoadModule {}
