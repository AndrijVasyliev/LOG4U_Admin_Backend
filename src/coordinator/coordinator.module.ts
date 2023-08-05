import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CoordinatorController } from './coordinator.controller';
import { Coordinator, CoordinatorSchema } from './coordinator.schema';
import { CoordinatorService } from './coordinator.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Coordinator.name, schema: CoordinatorSchema },
    ]),
  ],
  exports: [CoordinatorService],
  controllers: [CoordinatorController],
  providers: [CoordinatorService],
})
export class CoordinatorModule {}
