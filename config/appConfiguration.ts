import { registerAs } from '@nestjs/config';
import { application } from './configurationSections';
import { AppConfiguration } from './appConfiguration.interface';

export default registerAs(application,  (): AppConfiguration => ({
  port: +process.env.PORT!,
  serviceName: process.env.SERVICE_NAME!,
  heapLimit: +process.env.HEAP_LIMIT!,
  rssLimit: +process.env.RSS_LIMIT!,
}));
