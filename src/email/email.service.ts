import { Transporter, createTransport } from 'nodemailer';
import { PaginateModel, PaginateOptions } from 'mongoose';
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ConfigService } from '@nestjs/config';
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
import { MONGO_CONNECTION_NAME } from '../utils/constants';
import { escapeForRegExp } from '../utils/escapeForRegExp';

@Injectable()
export class EmailService {
  private readonly transporter?: Transporter;
  constructor(
    @InjectModel(Email.name, MONGO_CONNECTION_NAME)
    private readonly emailModel: PaginateModel<EmailDocument>,
    private readonly configService: ConfigService,
    private readonly log: LoggerService,
  ) {
    const host = this.configService.get<string>('email.host');
    const port = this.configService.get<number>('email.port');
    const secure = this.configService.get<boolean>('email.secure');
    const user = this.configService.get<string>('email.user');
    const pass = this.configService.get<string>('email.pass');

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

    this.log.debug('Saving Email');
    const email = await (await createdEmail.save()).populate('to.to');

    return EmailResultDto.fromEmailModel(email);
  }

  async updateEmail(
    id: string,
    updateEmailDto: UpdateEmailDto,
  ): Promise<EmailResultDto> {
    const email = await this.findEmailDocumentById(id);
    this.log.debug(`Setting new values: ${JSON.stringify(updateEmailDto)}`);
    Object.assign(email, updateEmailDto);
    this.log.debug('Saving Email');
    const savedEmail = await email.save();
    this.log.debug(`Email ${savedEmail._id} saved`);

    return EmailResultDto.fromEmailModel(email);
  }

  async deleteEmail(id: string): Promise<EmailResultDto> {
    const email = await this.findEmailDocumentById(id);

    this.log.debug(`Deleting Email ${email._id}`);

    await email.deleteOne();
    this.log.debug('Email deleted');

    return EmailResultDto.fromEmailModel(email);
  }
}
