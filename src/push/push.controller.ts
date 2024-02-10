import { Controller, Body, Post } from '@nestjs/common';
//import { SendPushDto } from './push.dto';
import { BodyValidationPipe } from '../utils/bodyValidate.pipe';
import { LoggerService } from '../logger';
import { SendPushValidation } from './push.validation';
import { Roles } from '../auth/auth.decorator';
import { PushService } from './push.service';
import { ExpoPushMessage, ExpoPushTicket } from 'expo-server-sdk';

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
}
