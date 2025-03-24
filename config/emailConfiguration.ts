import { registerAs } from '@nestjs/config';
import { email } from './configurationSections';
import { EmailConfiguration } from './emailConfiguration.interface';

export default registerAs(email,  (): EmailConfiguration => ({
  host: process.env.EMAIL_SMTP_HOST!,
  port: +process.env.EMAIL_SMTP_PORT!,
  secure: process.env.EMAIL_SMTP_SECURE === 'true',
  user: process.env.EMAIL_SMTP_USER!,
  pass: process.env.EMAIL_SMTP_PASS!,
}));
