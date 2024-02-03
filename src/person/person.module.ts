import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Person, PersonSchema } from './person.schema';
import { PersonService } from './person.service';
import { MONGO_CONNECTION_NAME } from '../utils/constants';

@Module({
  imports: [
    MongooseModule.forFeature(
      [{ name: Person.name, schema: PersonSchema }],
      MONGO_CONNECTION_NAME,
    ),
  ],
  exports: [PersonService],
  providers: [PersonService],
})
export class PersonModule {}
