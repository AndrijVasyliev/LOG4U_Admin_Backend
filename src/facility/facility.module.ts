import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { FacilityController } from './facility.controller';
import { Facility, FacilitySchema } from './facility.schema';
import { FacilityService } from './facility.service';
import { MONGO_CONNECTION_NAME } from '../utils/constants';

@Module({
  imports: [
    MongooseModule.forFeature(
      [{ name: Facility.name, schema: FacilitySchema }],
      MONGO_CONNECTION_NAME,
    ),
  ],
  exports: [FacilityService],
  controllers: [FacilityController],
  providers: [FacilityService],
})
export class FacilityModule {}
