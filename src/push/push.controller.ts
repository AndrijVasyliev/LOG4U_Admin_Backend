import { Controller, Body, Post, Get, Param } from '@nestjs/common';
import {
  ExpoPushMessage,
  ExpoPushReceipt,
  ExpoPushTicket,
} from 'expo-server-sdk';
//import { SendPushDto } from './push.dto';
import { BodyValidationPipe } from '../utils/bodyValidate.pipe';
import { LoggerService } from '../logger';
import { SendPushValidation } from './push.validation';
import { Roles } from '../auth/auth.decorator';
import { PushService } from './push.service';

@Controller('testPush')
@Roles('Admin', 'Super Admin')
export class PushController {
  constructor(
    private readonly log: LoggerService,
    private readonly pushService: PushService,
  ) {}

  @Post()
  async sendPush(
    @Body(new BodyValidationPipe(SendPushValidation))
    sendPushBodyDto: ExpoPushMessage,
  ): Promise<ExpoPushTicket[]> {
    return this.pushService.sendPush(sendPushBodyDto);
  }
  @Get(':receiptId')
  async getReceipt(@Param('receiptId') receiptId: string): Promise<{
    [id: string]: ExpoPushReceipt;
  }> {
    return this.pushService.getReceipt(receiptId);
  }
}
