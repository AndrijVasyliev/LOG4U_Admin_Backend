import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { EmailController } from './email.controller';
import { Email, EmailSchema } from './email.schema';
import { EmailService } from './email.service';
import { EmailWorkerService } from './email.worker.service';
import { EmailJobService } from './email.job.service';
import { MONGO_CONNECTION_NAME } from '../utils/constants';

@Module({
  imports: [
    MongooseModule.forFeature(
      [{ name: Email.name, schema: EmailSchema }],
      MONGO_CONNECTION_NAME,
    ),
  ],
  exports: [EmailService],
  controllers: [EmailController],
  providers: [EmailService, EmailWorkerService, EmailJobService],
})
export class EmailModule {}
