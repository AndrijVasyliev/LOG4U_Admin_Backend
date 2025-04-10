import { NestFactory } from '@nestjs/core';
import { RequestMethod } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { ConfigService } from '@nestjs/config';
import * as dayjs from 'dayjs';
import * as utc from 'dayjs/plugin/utc';
import * as timezone from 'dayjs/plugin/timezone';
import helmet from 'helmet';
import * as compression from 'compression';
import { AppModule } from './app.module';
import { NestLoggerService } from './logger';
import helmetOptions from './helmetOptions';
import { API_PATH_PREFIX, MOBILE_PATH_PREFIX } from './utils/constants';

dayjs.extend(utc);
dayjs.extend(timezone);

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bufferLogs: true,
    autoFlushLogs: true,
    snapshot: true,
  });
  const appLogger: NestLoggerService = app.get(NestLoggerService);
  app.useLogger(appLogger);

  const configService = app.get(ConfigService);

  const port = configService.get<number>('app.port') as number;

  app.use(helmet(helmetOptions));
  app.use(compression());
  app.enableShutdownHooks();
  app.setGlobalPrefix(API_PATH_PREFIX, {
    exclude: [
      { path: `${MOBILE_PATH_PREFIX}/(.*)`, method: RequestMethod.ALL },
      'metrics',
      'status',
      'health',
      'readiness',
      'liveness',
    ],
  });

  await app.listen(port);

  appLogger.debug(`Started App on port: ${port}`);
}
bootstrap();
