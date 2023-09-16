import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { OwnerDriverController } from './ownerDriver.controller';
import { OwnerDriver, OwnerDriverSchema } from './ownerDriver.schema';
import { OwnerDriverService } from './ownerDriver.service';
import { TruckModule } from '../truck/truck.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: OwnerDriver.name, schema: OwnerDriverSchema },
    ]),
    TruckModule,
  ],
  exports: [OwnerDriverService],
  controllers: [OwnerDriverController],
  providers: [OwnerDriverService],
})
export class OwnerDriverModule {}
