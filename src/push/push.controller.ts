import {
  Controller,
  Body,
  Post,
  Get,
  Param,
  Query,
  Patch,
  Delete,
} from '@nestjs/common';
import {
  ExpoPushMessage,
  ExpoPushReceipt,
  ExpoPushTicket,
} from 'expo-server-sdk';
import { Types } from 'mongoose';
import {
  CreatePushDto,
  PaginatedPushResultDto,
  PushQuery,
  PushResultDto,
  UpdatePushDto,
} from './push.dto';
import {
  CreatePushValidation,
  PushQueryParamsSchema,
  SendPushValidation,
  UpdatePushValidation,
} from './push.validation';
import { PushService } from './push.service';
import { Roles } from '../auth/auth.decorator';
import { LoggerService } from '../logger';
import { BodySchemaPipe } from '../utils/bodyValidate.pipe';
import { QueryParamsSchemaPipe } from '../utils/queryParamsValidate.pipe';
import { MongoObjectIdPipe } from '../utils/idValidate.pipe';

@Controller('push')
@Roles('Admin', 'Super Admin')
export class PushController {
  constructor(
    private readonly log: LoggerService,
    private readonly pushService: PushService,
  ) {}

  @Post('send')
  async sendPush(
    @Body(new BodySchemaPipe(SendPushValidation))
    sendPushBodyDto: ExpoPushMessage & { _contentAvailable?: boolean },
  ): Promise<ExpoPushTicket[]> {
    return this.pushService.sendPush(sendPushBodyDto);
  }
  @Get('receipt/:receiptId')
  async getReceipt(@Param('receiptId') receiptId: string): Promise<{
    [id: string]: ExpoPushReceipt;
  }> {
    return this.pushService.getReceipt(receiptId);
  }

  @Get()
  async getPushs(
    @Query(new QueryParamsSchemaPipe(PushQueryParamsSchema))
    pushQuery: PushQuery,
  ): Promise<PaginatedPushResultDto> {
    return this.pushService.getPushs(pushQuery);
  }

  @Get(':pushId')
  async getPush(
    @Param('pushId', MongoObjectIdPipe) pushId: Types.ObjectId,
  ): Promise<PushResultDto> {
    return this.pushService.findPushById(pushId);
  }

  @Post()
  async createPush(
    @Body(new BodySchemaPipe(CreatePushValidation))
    createPushBodyDto: CreatePushDto,
  ): Promise<PushResultDto> {
    return this.pushService.createPush(createPushBodyDto);
  }

  @Patch(':pushId')
  async updatePush(
    @Param('pushId', MongoObjectIdPipe) pushId: Types.ObjectId,
    @Body(new BodySchemaPipe(UpdatePushValidation))
    updatePushBodyDto: UpdatePushDto,
  ): Promise<PushResultDto> {
    return this.pushService.updatePush(pushId, updatePushBodyDto);
  }

  @Delete(':pushId')
  async deletePush(@Param('pushId', MongoObjectIdPipe) pushId: Types.ObjectId) {
    return this.pushService.deletePush(pushId);
  }
}
