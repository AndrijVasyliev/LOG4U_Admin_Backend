import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import * as compression from 'compression';
import { AppModule } from './app.module';
import { LoggerService } from './logger/logger.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
  });
  app.useLogger(app.get(LoggerService));

  const configService = app.get(ConfigService);
  const logger: LoggerService = app.get(LoggerService);

  const port = configService.get<number>('app.port') as number;

  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'", 'maps.googleapis.com'],
          scriptSrc: ["'self'", 'maps.googleapis.com'],
          imgSrc: [
            "'self'",
            'data:',
            'maps.gstatic.com',
            '*.googleapis.com',
            '*.ggpht.com',
          ],
        },
      },
    }),
  );
  app.use(compression());
  app.enableShutdownHooks();

  await app.listen(port);

  logger.info(`Started App on port: ${port}`);
}
bootstrap();
