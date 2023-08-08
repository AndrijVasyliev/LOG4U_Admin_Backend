import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { HealthController } from './health.controller';
import { LoggerService } from '../logger/logger.service';

@Module({
  imports: [
    TerminusModule.forRoot({
      logger: LoggerService,
    }),
  ],
  controllers: [HealthController],
})
export class HealthModule {}
