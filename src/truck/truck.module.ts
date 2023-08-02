import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TruckController } from './truck.controller';
import { Truck, TruckSchema } from './truck.schema';
import { TruckService } from './truck.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Truck.name, schema: TruckSchema }]),
  ],
  exports: [TruckService],
  controllers: [TruckController],
  providers: [TruckService],
})
export class TruckModule {}
