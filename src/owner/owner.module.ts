import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { OwnerController } from './owner.controller';
import { Owner, OwnerSchema } from './owner.schema';
import { OwnerService } from './owner.service';
import { TruckModule } from '../truck/truck.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Owner.name, schema: OwnerSchema }]),
    TruckModule,
  ],
  exports: [OwnerService],
  controllers: [OwnerController],
  providers: [OwnerService],
})
export class OwnerModule {}
