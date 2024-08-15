import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PushController } from './push.controller';
import { Push, PushSchema } from './push.schema';
import { PushService } from './push.service';
import { PersonModule } from '../person/person.module';
import { MONGO_CONNECTION_NAME } from '../utils/constants';

@Module({
  imports: [
    MongooseModule.forFeature(
      [{ name: Push.name, schema: PushSchema }],
      MONGO_CONNECTION_NAME,
    ),
    forwardRef(() => PersonModule),
  ],
  exports: [PushService],
  controllers: [PushController],
  providers: [PushService],
})
export class PushModule {}
