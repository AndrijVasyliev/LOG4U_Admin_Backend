import {
  Expo,
  ExpoPushMessage,
  ExpoPushReceipt,
  ExpoPushReceiptId,
  ExpoPushTicket,
} from 'expo-server-sdk';
import { mongo, PaginateModel, PaginateOptions } from 'mongoose';
import {
  OnApplicationBootstrap,
  OnModuleDestroy,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ConfigService } from '@nestjs/config';
import { SchedulerRegistry } from '@nestjs/schedule';
// import { HealthIndicatorResult } from '@nestjs/terminus';
import { Push, PushDocument } from './push.schema';
import {
  CreatePushDto,
  PushQuery,
  PushResultDto,
  PaginatedPushResultDto,
  UpdatePushDto,
} from './push.dto';
import { LoggerService } from '../logger';
import {
  MONGO_CONNECTION_NAME,
  MONGO_UNIQUE_INDEX_CONFLICT,
  PUSH_QUEUE_ORPHANED_JOB,
  PUSH_QUEUE_START_RECEIPT_JOB,
  UNIQUE_CONSTRAIN_ERROR,
} from '../utils/constants';
import { escapeForRegExp } from '../utils/escapeForRegExp';
import { ChangeDocument, Queue } from '../utils/queue';

const { MongoError, ChangeStream } = mongo;

@Injectable()
export class PushService implements OnApplicationBootstrap, OnModuleDestroy {
  private readonly expo?: Expo;
  private readonly changeStream?: InstanceType<typeof ChangeStream>;
  private queue?: Queue<ChangeDocument>;
  private readonly restartTasksOlder: number;
  private readonly getReceiptForTasksOlder: number;
  constructor(
    @InjectModel(Push.name, MONGO_CONNECTION_NAME)
    private readonly pushModel: PaginateModel<PushDocument>,
    private readonly configService: ConfigService,
    private readonly log: LoggerService,
    private schedulerRegistry: SchedulerRegistry,
  ) {
    const accessToken = this.configService.get<string>('push.accessToken');
    this.restartTasksOlder = configService.get<number>(
      'pushQueue.restartTasksOlder',
    ) as number;
    this.getReceiptForTasksOlder = this.configService.get<number>(
      'pushQueue.startReceiptForTasksOlder',
    ) as number;

    this.expo = new Expo({ accessToken });
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
      this.queue = new Queue<ChangeDocument>(
        async (): Promise<ChangeDocument> => {
          await stream.hasNext();
          return stream.next() as unknown as Promise<ChangeDocument>;
        },
        (change: ChangeDocument) => {
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-expect-error
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
    this.log.debug('Stopping queue');
    await this?.queue?.stop();
    this.log.debug('Closing change stream');
    await this?.changeStream?.close();
    this.log.debug('Push change stream is closed');
  }

  private async onNewPush(change: ChangeDocument) {
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
        const sendPushResult = await this.sendPush({
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

  private async onGetReceipt(change: ChangeDocument) {
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
        const receiptResult = (await this.getReceipt(push.sendResult.id))[
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

  async sendPush(push: ExpoPushMessage): Promise<ExpoPushTicket[]> {
    if (this.expo) {
      return this.expo.sendPushNotificationsAsync([push]);
    }
    return [];
  }
  async getReceipt(receipt: ExpoPushReceiptId): Promise<{
    [id: string]: ExpoPushReceipt;
  }> {
    if (this.expo) {
      return this.expo.getPushNotificationReceiptsAsync([receipt]);
    }
    return {};
  }
  /*async checkConnectivity(key: string): Promise<HealthIndicatorResult> {
    try {
        return { [key]: { status: 'up' } };
    } catch (e) {
      if (e instanceof Error) {
        this.log.error(
          `Error, while checking push transport status: ${e.message}`,
        );
      } else {
        this.log.error(
          `Error, while checking push transport status: ${JSON.stringify(e)}`,
        );
      }
      return { [key]: { status: 'down' } };
    }
    return { [key]: { status: 'down' } };
  }*/

  private async findPushDocumentById(id: string): Promise<PushDocument> {
    this.log.debug(`Searching for Push ${id}`);
    const push = await this.pushModel.findOne({ _id: id });
    if (!push) {
      throw new NotFoundException(`Push ${id} was not found`);
    }
    this.log.debug(`Push ${push._id}`);

    return push;
  }

  async findPushById(id: string): Promise<PushResultDto> {
    const push = await this.findPushDocumentById(id);
    return PushResultDto.fromPushModel(push);
  }

  async getPushs(query: PushQuery): Promise<PaginatedPushResultDto> {
    this.log.debug(`Searching for Pushs: ${JSON.stringify(query)}`);

    const documentQuery: Parameters<typeof this.pushModel.paginate>[0] = {};
    if (query.search) {
      const searchParams = Object.entries(query.search);
      searchParams.forEach((entry) => {
        entry[0] !== 'search' &&
          (documentQuery[entry[0]] = {
            $regex: new RegExp(escapeForRegExp(entry[1]), 'i'),
          });
      });
    }
    /*if (query?.search?.search) {
      const search = escapeForRegExp(query?.search?.search);
      documentQuery.$or = [
        { to: { $regex: new RegExp(search, 'i') } },
      ];
    }*/

    const options: PaginateOptions = {
      limit: query.limit,
      offset: query.offset,
    };
    if (query.direction && query.orderby) {
      let newOrder: string;
      switch (query.orderby) {
        case 'createdAt':
          newOrder = 'created_at';
          break;
        case 'updatedAt':
          newOrder = 'updated_at';
          break;
        default:
          newOrder = query.orderby;
      }
      options.sort = { [newOrder]: query.direction };
    }

    const res = await this.pushModel.paginate(documentQuery, options);

    return PaginatedPushResultDto.from(res);
  }

  async createPush(createPushDto: CreatePushDto): Promise<PushResultDto> {
    this.log.debug(`Creating new Push: ${JSON.stringify(createPushDto)}`);
    const createdPush = new this.pushModel(createPushDto);

    try {
      this.log.debug('Saving Push');
      const push = await (await createdPush.save()).populate('to.to');
      return PushResultDto.fromPushModel(push);
    } catch (e) {
      if (!(e instanceof Error)) {
        throw new InternalServerErrorException(JSON.stringify(e));
      }
      if (e instanceof MongoError && e.code === MONGO_UNIQUE_INDEX_CONFLICT) {
        throw new ConflictException({ type: UNIQUE_CONSTRAIN_ERROR, e });
      }
      throw new InternalServerErrorException(e.message);
    }
  }

  async updatePush(
    id: string,
    updatePushDto: UpdatePushDto,
  ): Promise<PushResultDto> {
    const push = await this.findPushDocumentById(id);
    this.log.debug(`Setting new values: ${JSON.stringify(updatePushDto)}`);
    Object.assign(push, updatePushDto);
    try {
      this.log.debug('Saving Push');
      const savedPush = await push.save();
      this.log.debug(`Push ${savedPush._id} saved`);
      return PushResultDto.fromPushModel(push);
    } catch (e) {
      if (!(e instanceof Error)) {
        throw new InternalServerErrorException(JSON.stringify(e));
      }
      if (e instanceof MongoError && e.code === MONGO_UNIQUE_INDEX_CONFLICT) {
        throw new ConflictException({ type: UNIQUE_CONSTRAIN_ERROR, e });
      }
      throw new InternalServerErrorException(e.message);
    }
  }

  async deletePush(id: string): Promise<PushResultDto> {
    const push = await this.findPushDocumentById(id);

    this.log.debug(`Deleting Push ${push._id}`);

    try {
      await push.deleteOne();
      this.log.debug('Push deleted');
    } catch (e) {
      if (!(e instanceof Error)) {
        throw new InternalServerErrorException(JSON.stringify(e));
      }
      throw new InternalServerErrorException(e.message);
    }
    return PushResultDto.fromPushModel(push);
  }
}
