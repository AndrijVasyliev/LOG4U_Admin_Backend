import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CoordinatorController } from './coordinator.controller';
import { Coordinator, CoordinatorSchema } from './coordinator.schema';
import { CoordinatorService } from './coordinator.service';
import { Person, PersonSchema } from '../person/person.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: Person.name,
        schema: PersonSchema,
        discriminators: [{ name: Coordinator.name, schema: CoordinatorSchema }],
      },
    ]),
  ],
  exports: [CoordinatorService],
  controllers: [CoordinatorController],
  providers: [CoordinatorService],
})
export class CoordinatorModule {}
