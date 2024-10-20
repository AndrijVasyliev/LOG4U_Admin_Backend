import { PaginateModel } from 'mongoose';
import {
  OnApplicationBootstrap,
  OnModuleDestroy,
  Injectable,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ConfigService } from '@nestjs/config';
import { SchedulerRegistry } from '@nestjs/schedule';
import { Email, EmailDocument } from './email.schema';
import { LoggerService } from '../logger';
import {
  EMAIL_QUEUE_ORPHANED_JOB,
  MONGO_CONNECTION_NAME,
} from '../utils/constants';

@Injectable()
export class EmailJobService implements OnApplicationBootstrap, OnModuleDestroy {
  private readonly restartTasksOlder: number;
  constructor(
    @InjectModel(Email.name, MONGO_CONNECTION_NAME)
    private readonly emailModel: PaginateModel<EmailDocument>,
    private readonly configService: ConfigService,
    private readonly log: LoggerService,
    private schedulerRegistry: SchedulerRegistry,
  ) {
    this.restartTasksOlder = configService.get<number>(
      'emailQueue.restartTasksOlder',
    ) as number;
  }

  onApplicationBootstrap(): void {
    this.log.debug('Starting jobs');
    const restartIntervalValue = this.configService.get<number>(
      'emailQueue.taskRestartInterval',
    ) as number;
    const restartInterval = setInterval(() => {
      this.restartOrphaned.bind(this)();
    }, restartIntervalValue);
    this.schedulerRegistry.addInterval(
      EMAIL_QUEUE_ORPHANED_JOB,
      restartInterval,
    );
  }

  async onModuleDestroy(): Promise<void> {
    this.log.debug('Stopping restart job');
    clearInterval(this.schedulerRegistry.getInterval(EMAIL_QUEUE_ORPHANED_JOB));
  }

  private async restartOrphaned(): Promise<void> {
    this.log.info('Restarting orphaned jobs');
    const olderThenDate = new Date(Date.now() - this.restartTasksOlder);
    this.log.info(`Try to restart items, older then ${olderThenDate}`);
    const result = await this.emailModel.updateMany(
      { state: { $eq: 'Processing' }, updated_at: { $lte: olderThenDate } },
      { $set: { state: 'Ready' } },
    );
    this.log.info(`Restarted ${result.modifiedCount}`);
    return;
  }
}
