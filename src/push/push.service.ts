import {
  Expo,
  ExpoPushMessage,
  ExpoPushReceipt,
  ExpoPushReceiptId,
  ExpoPushTicket,
} from 'expo-server-sdk';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
// import { HealthIndicatorResult } from '@nestjs/terminus';
import { LoggerService } from '../logger';
// import { SendPushDto } from './push.dto';

@Injectable()
export class PushService {
  private readonly expo?: Expo;
  constructor(
    private readonly log: LoggerService,
    private readonly configService: ConfigService,
  ) {
    const accessToken = this.configService.get<string>('push.accessToken');
    this.expo = new Expo({ accessToken });
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
  }*/
}
