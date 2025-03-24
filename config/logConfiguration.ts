import { registerAs } from '@nestjs/config';
import { logger } from './configurationSections';
import { LogConfiguration } from './logConfiguration.interface';
import { LogLevel } from '../src/logger';

export default registerAs(logger,  (): LogConfiguration => ({
  level: process.env.LOG_LEVEL as LogLevel,
  format: process.env.NODE_ENV === 'development' ? 'string' : 'json',
  requestIdHeader: process.env.REQUEST_ID_HEADER!,
  requestIdFieldName: process.env.REQUEST_ID_FIELD_NAME!,
}));
