import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { LocationController } from './location.controller';
import { Location, LocationSchema } from './location.schema';
import { LocationService } from './location.service';
import { MONGO_CONNECTION_NAME } from '../utils/constants';

@Module({
  imports: [
    MongooseModule.forFeature(
      [{ name: Location.name, schema: LocationSchema }],
      MONGO_CONNECTION_NAME,
    ),
  ],
  exports: [LocationService],
  controllers: [LocationController],
  providers: [LocationService],
})
export class LocationModule {}
