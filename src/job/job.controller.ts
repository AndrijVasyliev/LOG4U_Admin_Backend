import { Controller, Get } from '@nestjs/common';
import { SchedulerRegistry } from '@nestjs/schedule';
import { LoggerService } from '../logger';
import { Roles } from '../auth/auth.decorator';
import { CronJob } from 'cron/dist/job';

@Controller('job')
@Roles('Admin', 'Super Admin')
export class JobController {
  constructor(
    private readonly log: LoggerService,
    private schedulerRegistry: SchedulerRegistry,
  ) {}

  @Get('cron')
  getCronJobs(): Map<string, CronJob> {
    return this.schedulerRegistry.getCronJobs();
  }
  @Get('interval')
  getIntervals(): string[] {
    return this.schedulerRegistry.getIntervals();
  }
  @Get('timeout')
  getTimeouts(): string[] {
    return this.schedulerRegistry.getTimeouts();
  }
}
