import {
  Controller,
  Body,
  Post,
  Get,
  Query,
  Param,
  Patch,
  Delete,
} from '@nestjs/common';
import { Types } from 'mongoose';
import {
  CreateEmailDto,
  EmailQuery,
  EmailResultDto,
  PaginatedEmailResultDto,
  SendEmailDto,
  UpdateEmailDto,
} from './email.dto';
import { EmailService } from './email.service';
import {
  CreateEmailValidationSchema,
  EmailQueryParamsSchema,
  SendEmailValidationSchema,
  UpdateEmailValidationSchema,
} from './email.validation';
import { Roles } from '../auth/auth.decorator';
import { LoggerService } from '../logger';
import { BodySchemaPipe } from '../utils/bodyValidate.pipe';
import { QueryParamsSchemaPipe } from '../utils/queryParamsValidate.pipe';
import { MongoObjectIdPipe } from '../utils/idValidate.pipe';

@Controller('email')
@Roles('Admin', 'Super Admin')
export class EmailController {
  constructor(
    private readonly log: LoggerService,
    private readonly emailService: EmailService,
  ) {}

  @Post('send')
  async sendMail(
    @Body(new BodySchemaPipe(SendEmailValidationSchema))
    sendEmailBodyDto: SendEmailDto,
  ): Promise<Record<string, any>> {
    return this.emailService.sendMail(sendEmailBodyDto);
  }

  @Get()
  async getEmails(
    @Query(new QueryParamsSchemaPipe(EmailQueryParamsSchema))
    emailQuery: EmailQuery,
  ): Promise<PaginatedEmailResultDto> {
    return this.emailService.getEmails(emailQuery);
  }

  @Get(':emailId')
  async getEmail(
    @Param('emailId', MongoObjectIdPipe) emailId: Types.ObjectId,
  ): Promise<EmailResultDto> {
    return this.emailService.findEmailById(emailId);
  }

  @Post()
  async createEmail(
    @Body(new BodySchemaPipe(CreateEmailValidationSchema))
    createEmailBodyDto: CreateEmailDto,
  ): Promise<EmailResultDto> {
    return this.emailService.createEmail(createEmailBodyDto);
  }

  @Patch(':emailId')
  async updateEmail(
    @Param('emailId', MongoObjectIdPipe) emailId: Types.ObjectId,
    @Body(new BodySchemaPipe(UpdateEmailValidationSchema))
    updateEmailBodyDto: UpdateEmailDto,
  ): Promise<EmailResultDto> {
    return this.emailService.updateEmail(emailId, updateEmailBodyDto);
  }

  @Delete(':emailId')
  async deleteEmail(@Param('emailId', MongoObjectIdPipe) emailId: Types.ObjectId) {
    return this.emailService.deleteEmail(emailId);
  }
}
