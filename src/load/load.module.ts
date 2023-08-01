import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { LoadController } from './load.controller';
import { Load, LoadSchema } from './load.schema';
import { LoadService } from './load.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Load.name, schema: LoadSchema }]),
  ],
  exports: [LoadService],
  controllers: [LoadController],
  providers: [LoadService],
})
export class LoadModule {}
