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
      crossOriginEmbedderPolicy: false,
      contentSecurityPolicy: {
        directives: {
          defaultSrc: [
            "'self'",
            'maps.googleapis.com',
            'fonts.gstatic.com',
            'maps.gstatic.com',
            '*',
          ],
          fontSrc: [
            "'self'",
            'fonts.googleapis.com',
            'fonts.gstatic.com',
            'maps.gstatic.com',
          ],
          scriptSrc: ["'self'", 'maps.googleapis.com'],
          workerSrc: ["'self'", 'blob:'],
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
  app.setGlobalPrefix('api', {
    exclude: [
      'status',
      'health',
      'readiness',
      'liveness',
      'metrics',
      'main',
      'mobileApp/*',
    ],
  });

  await app.listen(port);

  logger.info(`Started App on port: ${port}`);
}
bootstrap();
