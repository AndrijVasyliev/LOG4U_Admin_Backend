import { registerAs } from '@nestjs/config';
import { LogConfiguration } from './logConfiguration.interface';

export default registerAs('log',  (): LogConfiguration => ({
  level: process.env.LOG_LEVEL || 'silly',
  format: process.env.NODE_ENV === 'development' ? 'string' : 'json',
  requestIdHeader: process.env.REQUEST_ID_HEADER
    ? process.env.REQUEST_ID_HEADER
    : 'X-Request-Id',
  requestIdFieldName: process.env.REQUEST_ID_FIELD_NAME
    ? process.env.REQUEST_ID_FIELD_NAME
    : 'requestId',
}));
