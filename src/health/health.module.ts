import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { HealthController } from './health.controller';
import { MongooseHealthIndicator } from './mongoose.healthIndicator';
import { LoggerService } from '../logger';
import { EmailModule } from '../email/email.module';

@Module({
  imports: [
    TerminusModule.forRoot({
      logger: LoggerService,
    }),
    EmailModule,
  ],
  controllers: [HealthController],
  providers: [MongooseHealthIndicator],
})
export class HealthModule {}
