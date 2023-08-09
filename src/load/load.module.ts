import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { HttpModule } from '@nestjs/axios';
import { LoadController } from './load.controller';
import { Load, LoadSchema } from './load.schema';
import { LoadService } from './load.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Load.name, schema: LoadSchema }]),
    HttpModule,
  ],
  exports: [LoadService],
  controllers: [LoadController],
  providers: [LoadService],
})
export class LoadModule {}
