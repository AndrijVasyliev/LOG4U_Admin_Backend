import { registerAs } from '@nestjs/config';
import { EmailConfiguration } from './emailConfiguration.interface';

export default registerAs('email',  (): EmailConfiguration => ({
  host: process.env.EMAIL_SMTP_HOST || 'smtp.gmail.com',
  port: +(process.env.EMAIL_SMTP_PORT || 587),
  secure: process.env.EMAIL_SMTP_SECURE === 'true',
  user: process.env.EMAIL_SMTP_USER || 'aa5856bk@gmail.com',
  pass: process.env.EMAIL_SMTP_PASS || 'cess ywcp klbc dalz',
}));
