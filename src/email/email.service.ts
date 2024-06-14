import { Transporter, createTransport } from 'nodemailer';
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
import { HealthIndicatorResult } from '@nestjs/terminus';
import { Email, EmailDocument } from './email.schema';
import {
  CreateEmailDto,
  EmailQuery,
  EmailResultDto,
  PaginatedEmailResultDto,
  SendEmailDto,
  UpdateEmailDto,
} from './email.dto';
import { LoggerService } from '../logger';
import {
  EMAIL_QUEUE_ORPHANED_JOB,
  MONGO_CONNECTION_NAME,
  MONGO_UNIQUE_INDEX_CONFLICT,
  UNIQUE_CONSTRAIN_ERROR,
} from '../utils/constants';
import { escapeForRegExp } from '../utils/escapeForRegExp';
import { ChangeDocument, Queue } from '../utils/queue';

const { MongoError, ChangeStream } = mongo;

@Injectable()
export class EmailService implements OnApplicationBootstrap, OnModuleDestroy {
  private readonly transporter?: Transporter;
  private readonly changeStream?: InstanceType<typeof ChangeStream>;
  private queue?: Queue<ChangeDocument>;
  private readonly restartTasksOlder: number;
  constructor(
    @InjectModel(Email.name, MONGO_CONNECTION_NAME)
    private readonly emailModel: PaginateModel<EmailDocument>,
    private readonly configService: ConfigService,
    private readonly log: LoggerService,
    private schedulerRegistry: SchedulerRegistry,
  ) {
    const host = this.configService.get<string>('email.host');
    const port = this.configService.get<number>('email.port');
    const secure = this.configService.get<boolean>('email.secure');
    const user = this.configService.get<string>('email.user');
    const pass = this.configService.get<string>('email.pass');
    this.restartTasksOlder = configService.get<number>(
      'emailQueue.restartTasksOlder',
    ) as number;

    const options: any = {
      // ToDo refactor next after app logger refactor and if needed
      /*logger: {
        trace: (...args: any[]) => {
          log.silly(`EMAIL: ${args}`);
        },
        debug: (...args: any[]) => {
          log.silly(`EMAIL: ${args}`);
        },
        info: (...args: any[]) => {
          log.silly(`EMAIL: ${args}`);
        },
        warn: (...args: any[]) => {
          log.silly(`EMAIL: ${args}`);
        },
        error: (...args: any[]) => {
          log.silly(`EMAIL: ${args}`);
        },
        fatal: (...args: any[]) => {
          log.silly(`EMAIL: ${args}`);
        },
      },
      debug: true,*/
      host,
      port,
      secure,
      // service: 'gmail',
      auth: {
        user,
        pass,
      },
    };

    this.transporter = createTransport(options);
    this.changeStream = emailModel.watch([
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
          await stream.hasNext();
          return stream.next() as unknown as Promise<ChangeDocument>;
        },
        this.onNewEmail.bind(this),
        this.configService.get<number>('emailQueue.maxParallelTasks') as number,
        this.configService.get<number>('emailQueue.taskTimeout') as number,
        this.log || console.log,
      );
    }
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
    this.log.debug('Stopping queue');
    await this?.queue?.stop();
    this.log.debug('Closing change stream');
    await this?.changeStream?.close();
    this.log.debug('Email change stream is closed');
  }

  private async onNewEmail(change: ChangeDocument) {
    this.log.info(`Change ${JSON.stringify(change)}`);
    const email = await this.emailModel
      .findOneAndUpdate(
        { _id: change.documentKey._id, state: 'Ready' },
        {
          state: 'Processing',
        },
      )
      .populate('to.to');
    this.log.info(`Doc ${email?._id}`);
    if (email) {
      try {
        const toArray: string[] = [];
        if (email?.to) {
          email.to.forEach((to) => {
            if (to?.to?.email) {
              if (to.to.fullName) {
                toArray.push(`${to.to.fullName}<${to.to.email}>`);
              } else {
                toArray.push(`${to.to.email}`);
              }
            }
          });
        }
        const to = toArray.join(',');
        this.log.debug(`Email to: ${to}`);
        if (!to) {
          throw new Error('No destination email addresses');
        }
        const sendMailResult = await this.sendMail({
          to,
          from: email.from,
          subject: email.subject,
          text: email.text,
          html: email.html,
        });
        email.set('sendResult', sendMailResult);
        email.set('state', 'Sent');
      } catch (error) {
        email.set('sendResult', error);
        email.set('state', 'Error');
      }
      try {
        this.log.debug('Saving Email');
        await email.save();
        this.log.debug('Email updated');
      } catch (error) {
        if (error instanceof Error) {
          this.log.error(
            `Error sending email ${change.documentKey._id}`,
            error,
          );
        } else {
          this.log.error(`Error sending email ${JSON.stringify(error)}`);
        }
      }
    }
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

  async sendMail(email: SendEmailDto): Promise<Record<string, any>> {
    if (this.transporter) {
      const info = await this.transporter.sendMail(email);
      this.log.info(`Email send result: ${JSON.stringify(info)}`);
      return info;
    }
    return {};
  }

  async checkConnectivity(key: string): Promise<HealthIndicatorResult> {
    try {
      this.log.debug('Checking email transport status');
      const isAllOk = await this.transporter?.verify();
      this.log.debug(`Email transport status: ${isAllOk}`);
      if (isAllOk) {
        return { [key]: { status: 'up' } };
      }
    } catch (e) {
      if (e instanceof Error) {
        this.log.error(
          `Error, while checking email transport status: ${e.message}`,
        );
      } else {
        this.log.error(
          `Error, while checking email transport status: ${JSON.stringify(e)}`,
        );
      }
      return { [key]: { status: 'down' } };
    }
    return { [key]: { status: 'down' } };
  }

  private async findEmailDocumentById(id: string): Promise<EmailDocument> {
    this.log.debug(`Searching for Email ${id}`);
    const email = await this.emailModel.findOne({ _id: id }).populate('to.to');
    if (!email) {
      throw new NotFoundException(`Email ${id} was not found`);
    }
    this.log.debug(`Email ${email._id}`);

    return email;
  }

  async findEmailById(id: string): Promise<EmailResultDto> {
    const email = await this.findEmailDocumentById(id);
    return EmailResultDto.fromEmailModel(email);
  }

  async getEmails(query: EmailQuery): Promise<PaginatedEmailResultDto> {
    this.log.debug(`Searching for Emails: ${JSON.stringify(query)}`);

    const documentQuery: Parameters<typeof this.emailModel.paginate>[0] = {};
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
    options.populate = ['to.to'];
    const res = await this.emailModel.paginate(documentQuery, options);

    return PaginatedEmailResultDto.from(res);
  }

  async createEmail(createEmailDto: CreateEmailDto): Promise<EmailResultDto> {
    this.log.debug(`Creating new Email: ${JSON.stringify(createEmailDto)}`);
    const createdEmail = new this.emailModel(createEmailDto);

    try {
      this.log.debug('Saving Email');
      const email = await (await createdEmail.save()).populate('to.to');
      return EmailResultDto.fromEmailModel(email);
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

  async updateEmail(
    id: string,
    updateEmailDto: UpdateEmailDto,
  ): Promise<EmailResultDto> {
    const email = await this.findEmailDocumentById(id);
    this.log.debug(`Setting new values: ${JSON.stringify(updateEmailDto)}`);
    Object.assign(email, updateEmailDto);
    try {
      this.log.debug('Saving Email');
      const savedEmail = await email.save();
      this.log.debug(`Email ${savedEmail._id} saved`);
      return EmailResultDto.fromEmailModel(email);
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

  async deleteEmail(id: string): Promise<EmailResultDto> {
    const email = await this.findEmailDocumentById(id);

    this.log.debug(`Deleting Email ${email._id}`);

    try {
      await email.deleteOne();
      this.log.debug('Email deleted');
    } catch (e) {
      if (!(e instanceof Error)) {
        throw new InternalServerErrorException(JSON.stringify(e));
      }
      throw new InternalServerErrorException(e.message);
    }
    return EmailResultDto.fromEmailModel(email);
  }
}
