import {
  Expo,
  ExpoPushMessage,
  ExpoPushReceipt,
  ExpoPushReceiptId,
  ExpoPushTicket,
} from 'expo-server-sdk';
import { mongo, PaginateModel, PaginateOptions } from 'mongoose';
import { ChangeStream } from 'mongodb';
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
  UNIQUE_CONSTRAIN_ERROR,
} from '../utils/constants';
import { escapeForRegExp } from '../utils/escapeForRegExp';
import { ChangeDocument, Queue } from '../utils/queue';

const { MongoError } = mongo;

@Injectable()
export class PushService {
  private readonly expo?: Expo;
  private readonly changeStream?: ChangeStream;
  private queue?: Queue<ChangeDocument>;
  private restartInterval: ReturnType<typeof setInterval>;
  constructor(
    @InjectModel(Push.name, MONGO_CONNECTION_NAME)
    private readonly pushModel: PaginateModel<PushDocument>,
    private readonly configService: ConfigService,
    private readonly log: LoggerService,
  ) {
    const accessToken = this.configService.get<string>('push.accessToken');
    this.expo = new Expo({ accessToken });
    // ToDo remove next comments after mongoose update
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error
    this.changeStream = pushModel.watch([
      {
        $match: {
          operationType: 'update',
          'updateDescription.updatedFields.state': 'Ready',
        },
      },
      { $project: { 'documentKey._id': 1 } },
    ]);
  }

  onApplicationBootstrap(): void {
    this.log.debug('Creating queue');
    const stream = this?.changeStream;
    if (stream) {
      this.queue = new Queue<ChangeDocument>(
        async (): Promise<ChangeDocument> => {
          if (!this.changeStream) {
            throw new Error('No stream');
          }
          await this?.changeStream?.hasNext();
          return this?.changeStream?.next() as unknown as Promise<ChangeDocument>;
        },
        this.onNewPush.bind(this),
        this.configService.get<number>('pushQueue.maxParallelTasks') as number,
        this.configService.get<number>('pushQueue.taskTimeout') as number,
        this.log || console.log,
      );
    }
    const interval = this.configService.get<number>(
      'pushQueue.taskRestartInterval',
    ) as number;
    this.restartInterval = setInterval(() => {
      this.restartOrphaned.bind(this)();
    }, interval);
  }

  async onModuleDestroy(): Promise<void> {
    this.log.debug('Stopping restart job');
    clearInterval(this.restartInterval);
    this.log.debug('Stopping queue');
    await this?.queue?.stop();
    this.log.debug('Closing change stream');
    await this?.changeStream?.close();
    this.log.debug('Push change stream is closed');
  }

  async onNewPush(change: ChangeDocument) {
    this.log.info(`Change ${JSON.stringify(change)}`);
    const push = await this.pushModel.findOneAndUpdate(
      { _id: change.documentKey._id, state: 'Ready' },
      {
        state: 'Processing',
      },
    );
    this.log.info(`Doc ${push?._id}`);
    if (push) {
      try {
        if (!push.to.pushToken) {
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
        push.set('state', 'Error');
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
    const olderThenDate = new Date(
      (Date.now() -
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-expect-error
        this.configService.get<number>(
          'pushQueue.restartTasksOlder',
        )) as number,
    );
    this.log.info(`Try to restart items, older then ${olderThenDate}`);
    const result = await this.pushModel.updateMany(
      { state: { $eq: 'Processing' }, updated_at: { $lte: olderThenDate } },
      { $set: { state: 'Ready' } },
    );
    this.log.info(`Restarted ${result.modifiedCount}`);
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
