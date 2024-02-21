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
import {
  CreateEmailDto,
  EmailQuery,
  EmailQuerySearch,
  EmailResultDto,
  PaginatedEmailResultDto,
  SendEmailDto,
  UpdateEmailDto,
} from './email.dto';
import { BodyValidationPipe } from '../utils/bodyValidate.pipe';
import { EmailService } from './email.service';
import {
  CreateEmailValidation,
  EmailQueryParamsSchema,
  SendEmailValidation,
  UpdateEmailValidation,
} from './email.validation';
import { Roles } from '../auth/auth.decorator';
import { LoggerService } from '../logger';
import { QueryParamsPipe } from '../utils/queryParamsValidate.pipe';
import { MongoObjectIdPipe } from '../utils/idValidate.pipe';

@Controller('testEmail')
@Roles('Admin', 'Super Admin')
export class EmailController {
  constructor(
    private readonly log: LoggerService,
    private readonly emailService: EmailService,
  ) {}

  @Post('send')
  async sendMail(
    @Body(new BodyValidationPipe(SendEmailValidation))
    sendEmailBodyDto: SendEmailDto,
  ): Promise<Record<string, any>> {
    return this.emailService.sendMail(sendEmailBodyDto);
  }

  @Get()
  async getEmails(
    @Query(new QueryParamsPipe<EmailQuerySearch>(EmailQueryParamsSchema))
    emailQuery: EmailQuery,
  ): Promise<PaginatedEmailResultDto> {
    return this.emailService.getEmails(emailQuery);
  }

  @Get(':emailId')
  async getEmail(
    @Param('emailId', MongoObjectIdPipe) emailId: string,
  ): Promise<EmailResultDto> {
    return this.emailService.findEmailById(emailId);
  }

  @Post()
  async createEmail(
    @Body(new BodyValidationPipe(CreateEmailValidation))
    createEmailBodyDto: CreateEmailDto,
  ): Promise<EmailResultDto> {
    return this.emailService.createEmail(createEmailBodyDto);
  }

  @Patch(':emailId')
  async updateEmail(
    @Param('emailId', MongoObjectIdPipe) emailId: string,
    @Body(new BodyValidationPipe(UpdateEmailValidation))
    updateEmailBodyDto: UpdateEmailDto,
  ): Promise<EmailResultDto> {
    return this.emailService.updateEmail(emailId, updateEmailBodyDto);
  }

  @Delete(':emailId')
  async deleteEmail(@Param('emailId', MongoObjectIdPipe) emailId: string) {
    return this.emailService.deleteEmail(emailId);
  }
}
