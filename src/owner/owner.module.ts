import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { OwnerController } from './owner.controller';
import { Owner, OwnerSchema } from './owner.schema';
import { OwnerService } from './owner.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Owner.name, schema: OwnerSchema }]),
  ],
  exports: [OwnerService],
  controllers: [OwnerController],
  providers: [OwnerService],
})
export class OwnerModule {}
