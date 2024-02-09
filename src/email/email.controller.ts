import { Controller, Body, Post } from '@nestjs/common';
import { SendEmailDto } from './email.dto';
import { BodyValidationPipe } from '../utils/bodyValidate.pipe';
import { LoggerService } from '../logger';
import { SendEmailValidation } from './email.validation';
import { Public, Roles } from '../auth/auth.decorator';
import { EmailService } from './email.service';

@Controller('testEmail')
@Roles('Admin', 'Super Admin')
export class EmailController {
  constructor(
    private readonly log: LoggerService,
    private readonly emailService: EmailService,
  ) {}

  @Post()
  async sendMail(
    @Body(new BodyValidationPipe(SendEmailValidation))
    sendEmailBodyDto: SendEmailDto,
  ): Promise<string> {
    return this.emailService.sendMail(sendEmailBodyDto);
  }
}
