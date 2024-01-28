import { Transporter, createTransport } from 'nodemailer';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HealthIndicatorResult } from '@nestjs/terminus';
import { LoggerService } from '../logger/logger.service';
import { SendEmailDto } from './email.dto';

@Injectable()
export class EmailService {
  private readonly transporter?: Transporter;
  constructor(
    private readonly log: LoggerService,
    private readonly configService: ConfigService,
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

  async sendMail(email: SendEmailDto): Promise<string> {
    if (this.transporter) {
      const info = await this.transporter.sendMail(email);

      return info.messageId;
    }
    return '';
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
}
