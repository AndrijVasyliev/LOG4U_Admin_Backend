import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { OwnerController } from './owner.controller';
import { Owner, OwnerSchema } from './owner.schema';
import { OwnerService } from './owner.service';
import { TruckModule } from '../truck/truck.module';
import { MONGO_CONNECTION_NAME } from '../utils/constants';

@Module({
  imports: [
    MongooseModule.forFeature(
      [{ name: Owner.name, schema: OwnerSchema }],
      MONGO_CONNECTION_NAME,
    ),
    TruckModule,
  ],
  exports: [OwnerService],
  controllers: [OwnerController],
  providers: [OwnerService],
})
export class OwnerModule {}
