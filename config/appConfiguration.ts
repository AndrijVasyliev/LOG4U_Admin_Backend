import { registerAs } from '@nestjs/config';
import { application } from './configurationSections';
import { AppConfiguration } from './appConfiguration.interface';
import {
  HEALTH_MEMORY_HEAP_LIMIT,
  HEALTH_MEMORY_RSS_LIMIT,
} from '../src/utils/constants';

export default registerAs(application,  (): AppConfiguration => ({
  port: +(process.env.PORT || 8181),
    serviceName: process.env.SERVICE_NAME || 'Admin_BE',
    heapLimit:
      (process.env.HEAP_LIMIT &&
        Number.isFinite(Number(process.env.HEAP_LIMIT)) &&
        +process.env.HEAP_LIMIT) ||
      HEALTH_MEMORY_HEAP_LIMIT,
    rssLimit:
      (process.env.RSS_LIMIT &&
        Number.isFinite(Number(process.env.RSS_LIMIT)) &&
        +process.env.RSS_LIMIT) ||
      HEALTH_MEMORY_RSS_LIMIT,
}));
