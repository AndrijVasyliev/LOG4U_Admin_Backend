import { mongo, PaginateModel } from 'mongoose';
import {
  OnApplicationBootstrap,
  OnApplicationShutdown,
  Injectable,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ConfigService } from '@nestjs/config';
import { Email, EmailDocument } from './email.schema';
import { EmailChangeDocument } from './email.dto';
import { EmailService } from './email.service';
import { LoggerService } from '../logger';
import { MONGO_CONNECTION_NAME } from '../utils/constants';
import { ChangeDocument, Queue } from '../utils/queue';

const { ChangeStream } = mongo;

@Injectable()
export class EmailWorkerService
  implements OnApplicationBootstrap, OnApplicationShutdown
{
  private readonly changeStream?: InstanceType<typeof ChangeStream>;
  private queue?: Queue<ChangeDocument & EmailChangeDocument>;
  constructor(
    @InjectModel(Email.name, MONGO_CONNECTION_NAME)
    private readonly emailModel: PaginateModel<EmailDocument>,
    private readonly emailService: EmailService,
    private readonly configService: ConfigService,
    private readonly log: LoggerService,
  ) {
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
      this.queue = new Queue<ChangeDocument & EmailChangeDocument>(
        async (): Promise<ChangeDocument & EmailChangeDocument> => {
          await stream.hasNext();
          return stream.next() as unknown as Promise<
            ChangeDocument & EmailChangeDocument
          >;
        },
        this.onNewEmail.bind(this),
        this.configService.get<number>('emailQueue.maxParallelTasks') as number,
        this.configService.get<number>('emailQueue.taskTimeout') as number,
        this.log || console.log,
      );
    }
  }

  async onApplicationShutdown(): Promise<void> {
    this.log.debug('Stopping queue');
    await this?.queue?.stop();
    this.log.debug('Closing change stream');
    await this?.changeStream?.close();
    this.log.debug('Email change stream is closed');
  }

  private async onNewEmail(change: ChangeDocument & EmailChangeDocument) {
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
        const sendMailResult = await this.emailService.sendMail({
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
}
