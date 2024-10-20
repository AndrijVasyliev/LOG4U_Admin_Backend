import { PaginateModel } from 'mongoose';
import {
  OnApplicationBootstrap,
  OnModuleDestroy,
  Injectable,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ConfigService } from '@nestjs/config';
import { SchedulerRegistry } from '@nestjs/schedule';
import { Push, PushDocument } from './push.schema';
import { LoggerService } from '../logger';
import {
  MONGO_CONNECTION_NAME,
  PUSH_QUEUE_ORPHANED_JOB,
  PUSH_QUEUE_START_RECEIPT_JOB,
} from '../utils/constants';

@Injectable()
export class PushJobService implements OnApplicationBootstrap, OnModuleDestroy {
  private readonly restartTasksOlder: number;
  private readonly getReceiptForTasksOlder: number;
  constructor(
    @InjectModel(Push.name, MONGO_CONNECTION_NAME)
    private readonly pushModel: PaginateModel<PushDocument>,
    private readonly configService: ConfigService,
    private readonly log: LoggerService,
    private schedulerRegistry: SchedulerRegistry,
  ) {
    this.restartTasksOlder = configService.get<number>(
      'pushQueue.restartTasksOlder',
    ) as number;
    this.getReceiptForTasksOlder = this.configService.get<number>(
      'pushQueue.startReceiptForTasksOlder',
    ) as number;
  }

  onApplicationBootstrap(): void {
    this.log.debug('Starting jobs');
    const startReceiptIntervalValue = this.configService.get<number>(
      'pushQueue.taskStartReceiptInterval',
    ) as number;
    const restartIntervalValue = this.configService.get<number>(
      'pushQueue.taskRestartInterval',
    ) as number;
    const startReceiptInterval = setInterval(() => {
      this.startReceivingReceipt.bind(this)();
    }, startReceiptIntervalValue);
    this.schedulerRegistry.addInterval(
      PUSH_QUEUE_START_RECEIPT_JOB,
      startReceiptInterval,
    );
    const restartInterval = setInterval(() => {
      this.restartOrphaned.bind(this)();
    }, restartIntervalValue);
    this.schedulerRegistry.addInterval(
      PUSH_QUEUE_ORPHANED_JOB,
      restartInterval,
    );
  }

  async onModuleDestroy(): Promise<void> {
    this.log.debug('Stopping start receipt job');
    clearInterval(
      this.schedulerRegistry.getInterval(PUSH_QUEUE_START_RECEIPT_JOB),
    );
    this.log.debug('Stopping restart job');
    clearInterval(this.schedulerRegistry.getInterval(PUSH_QUEUE_ORPHANED_JOB));
  }
  private async restartOrphaned(): Promise<void> {
    this.log.info('Restarting orphaned jobs');
    const olderThenDate = new Date(Date.now() - this.restartTasksOlder);
    this.log.info(`Try to restart items, older then ${olderThenDate}`);
    const result = await this.pushModel.updateMany(
      {
        $or: [
          { state: { $eq: 'Processing send' } },
          { state: { $eq: 'Processing receiving receipt' } },
        ],
        updated_at: { $lte: olderThenDate },
      },
      [
        {
          $set: {
            state: {
              $switch: {
                branches: [
                  {
                    case: { $eq: ['$state', 'Processing send'] },
                    then: 'Ready for send',
                  },
                  {
                    case: { $eq: ['$state', 'Processing receiving receipt'] },
                    then: 'Ready for receiving receipt',
                  },
                ],
              },
            },
          },
        },
      ],
    );
    this.log.info(`Restarted ${result.modifiedCount}`);
    return;
  }

  private async startReceivingReceipt(): Promise<void> {
    this.log.info('Starting to receive receipts');
    const olderThenDate = new Date(Date.now() - this.getReceiptForTasksOlder);
    this.log.info(
      `Try to start to receive receipts for items, older then ${olderThenDate}`,
    );
    const result = await this.pushModel.updateMany(
      {
        state: { $eq: 'Sent for deliver' },
        updated_at: { $lte: olderThenDate },
      },
      { $set: { state: 'Ready for receiving receipt' } },
    );
    this.log.info(`Started ${result.modifiedCount}`);
    return;
  }
}
