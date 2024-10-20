import { mongo, PaginateModel } from 'mongoose';
import {
  OnApplicationBootstrap,
  OnModuleDestroy,
  Injectable,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ConfigService } from '@nestjs/config';
import { Push, PushDocument } from './push.schema';
import { PushChangeDocument } from './push.dto';
import { PushService } from './push.service';
import { LoggerService } from '../logger';
import {
  MONGO_CONNECTION_NAME,
} from '../utils/constants';
import { ChangeDocument, Queue } from '../utils/queue';

const { ChangeStream } = mongo;

@Injectable()
export class PushWorkerService implements OnApplicationBootstrap, OnModuleDestroy {
  private readonly changeStream?: InstanceType<typeof ChangeStream>;
  private queue?: Queue<ChangeDocument & PushChangeDocument>;
  constructor(
    @InjectModel(Push.name, MONGO_CONNECTION_NAME)
    private readonly pushModel: PaginateModel<PushDocument>,
    private readonly pushService: PushService,
    private readonly configService: ConfigService,
    private readonly log: LoggerService,
  ) {
    this.changeStream = pushModel.watch([
      {
        $match: {
          operationType: 'update',
          $or: [
            { 'updateDescription.updatedFields.state': 'Ready for send' },
            {
              'updateDescription.updatedFields.state':
                'Ready for receiving receipt',
            },
          ],
        },
      },
      {
        $project: {
          'documentKey._id': 1,
          'updateDescription.updatedFields.state': 1,
        },
      },
    ]);
  }

  onApplicationBootstrap(): void {
    this.log.debug('Creating queue');
    const stream = this?.changeStream;
    if (stream) {
      this.queue = new Queue<ChangeDocument & PushChangeDocument>(
        async (): Promise<ChangeDocument & PushChangeDocument> => {
          await stream.hasNext();
          return stream.next() as unknown as Promise<ChangeDocument & PushChangeDocument>;
        },
        (change: ChangeDocument & PushChangeDocument) => {
          if (change.operationType === 'insert') {
            return Promise.resolve(undefined);
          }
          switch (change?.updateDescription?.updatedFields?.state) {
            case 'Ready for send':
              return this.onNewPush.call(this, change);
            case 'Ready for receiving receipt':
              return this.onGetReceipt.call(this, change);
            default:
              return Promise.resolve(undefined);
          }
        },
        this.configService.get<number>('pushQueue.maxParallelTasks') as number,
        this.configService.get<number>('pushQueue.taskTimeout') as number,
        this.log || console.log,
      );
    }
  }

  async onModuleDestroy(): Promise<void> {
    this.log.debug('Stopping queue');
    await this?.queue?.stop();
    this.log.debug('Closing change stream');
    await this?.changeStream?.close();
    this.log.debug('Push change stream is closed');
  }

  private async onNewPush(change: ChangeDocument & PushChangeDocument) {
    this.log.info(`Change ${JSON.stringify(change)}`);
    const push = await this.pushModel.findOneAndUpdate(
      { _id: change.documentKey._id, state: 'Ready for send' },
      {
        state: 'Processing send',
      },
    );
    this.log.info(`Doc ${push?._id}`);
    if (push) {
      try {
        if (!push?.to?.pushToken) {
          throw new Error('No destination push token');
        }
        const sendPushResult = await this.pushService.sendPush({
          to: push.to.pushToken,
          data: push.data,
          title: push.title,
          subtitle: push.subtitle,
          body: push.body,
          badge: push.badge,
          sound: 'default',
          priority: 'default',
        });
        push.set('sendResult', sendPushResult[0]);
        push.set('state', 'Sent for deliver');
      } catch (error) {
        push.set('sendResult', error);
        push.set('state', 'Error sending');
      }
      try {
        this.log.debug('Saving Push');
        await push.save();
        this.log.debug('Push updated');
      } catch (error) {
        if (error instanceof Error) {
          this.log.error(`Error sending push ${change.documentKey._id}`, error);
        } else {
          this.log.error(`Error sending push ${JSON.stringify(error)}`);
        }
      }
    }
  }

  private async onGetReceipt(change: ChangeDocument & PushChangeDocument) {
    this.log.info(`Change ${JSON.stringify(change)}`);
    const push = await this.pushModel.findOneAndUpdate(
      { _id: change.documentKey._id, state: 'Ready for receiving receipt' },
      {
        state: 'Processing receiving receipt',
      },
    );
    this.log.info(`Doc ${push?._id}`);
    if (push) {
      try {
        if (!push?.sendResult?.id) {
          throw new Error('No receipt id in send result');
        }
        const receiptResult = (await this.pushService.getReceipt(push.sendResult.id))[
          push.sendResult.id
          ];
        if (receiptResult) {
          push.set('receiptResult', receiptResult);
          if (receiptResult.status === 'ok') {
            push.set('state', 'Sent to user');
          } else {
            push.set('state', 'Error from receipt');
            const person = push.to;
            person.set('pushToken', undefined);
            await person.save();
          }
        } else {
          throw new Error('No receipt');
        }
      } catch (error) {
        push.set('sendResult', error);
        push.set('state', 'Error receiving receipt');
      }
      try {
        this.log.debug('Saving Push');
        await push.save();
        this.log.debug('Push updated');
      } catch (error) {
        if (error instanceof Error) {
          this.log.error(`Error sending push ${change.documentKey._id}`, error);
        } else {
          this.log.error(`Error sending push ${JSON.stringify(error)}`);
        }
      }
    }
  }
}
