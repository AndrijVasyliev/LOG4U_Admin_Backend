import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { OwnerDriverController } from './ownerDriver.controller';
import { OwnerDriver, OwnerDriverSchema } from './ownerDriver.schema';
import { OwnerDriverService } from './ownerDriver.service';
import { Person, PersonSchema } from '../person/person.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: Person.name,
        schema: PersonSchema,
        discriminators: [{ name: OwnerDriver.name, schema: OwnerDriverSchema }],
      },
    ]),
  ],
  exports: [OwnerDriverService],
  controllers: [OwnerDriverController],
  providers: [OwnerDriverService],
})
export class OwnerDriverModule {}
