import './utils/fixMongooseStringValidation';
import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';

import configuration from '../config';
import { EnvValidationSchema } from '../config/env.validation';

import { LoggerModule, LogLevel, LogFormat, LoggerModuleOptions } from './logger';
import { ResponseTimeMiddleware } from './utils/responseTime.middleware';

import { MongooseConnectionModule } from './mongoose/mongooseConnection.module';
import { HealthModule } from './health/health.module';
import { MetricsModule } from './metrics/metrics.module';
import { PersonModule } from './person/person.module';
import { OwnerModule } from './owner/owner.module';
import { OwnerDriverModule } from './ownerDriver/ownerDriver.module';
import { CoordinatorModule } from './coordinator/coordinator.module';
import { CoordinatorDriverModule } from './coordinatorDriver/coordinatorDriver.module';
import { DriverModule } from './driver/driver.module';
import { FacilityModule } from './facility/facility.module';
import { CustomerModule } from './customer/customer.module';
import { UserModule } from './user/user.module';
import { LocationModule } from './location/location.module';
import { LoadModule } from './load/load.module';
import { TruckModule } from './truck/truck.module';
import { JobModule } from './job/job.module';
import { GoogleGeoApiModule } from './googleGeoApi/googleGeoApi.module';
import { MobileAppModule } from './mobileApp/mobileApp.module';
import { AuthModule } from './auth/auth.module';
import { EmailModule } from './email/email.module';
import { PushModule } from './push/push.module';
import { FileModule } from './file/file.module';
import { ChatModule } from './chat/chat.module';

import { CoordinatorController } from './coordinator/coordinator.controller';
import { CoordinatorDriverController } from './coordinatorDriver/coordinatorDriver.controller';
import { DriverController } from './driver/driver.controller';
import { EmailController } from './email/email.controller';
import { FileController } from './file/file.controller';
import { HealthController } from './health/health.controller';
import { LoadController } from './load/load.controller';
import { LocationController } from './location/location.controller';
import { MetricsController } from './metrics/metrics.controller';
import { MobileAppController } from './mobileApp/mobileApp.controller';
import { OwnerController } from './owner/owner.controller';
import { OwnerDriverController } from './ownerDriver/ownerDriver.controller';
import { FacilityController } from './facility/facility.controller';
import { CustomerController } from './customer/customer.controller';
import { PersonController } from './person/person.controller';
import { PushController } from './push/push.controller';
import { TruckController } from './truck/truck.controller';
import { UserController } from './user/user.controller';

@Module({
  imports: [
    LoggerModule.registerAsync({
      useFactory: async (config: ConfigService): Promise<LoggerModuleOptions> => {
        return {
          level: config.get<LogLevel>('log.level') || 'verbose',
          format: config.get<LogFormat>('log.format') || 'string',
          serviceName: config.get<string>('app.serviceName') || '',
          requestIdFieldName:
            config.get<string>('log.requestIdFieldName') || 'requestId',
          forRoutes: [
            // { path: '*', method: RequestMethod.ALL },
            CoordinatorController,
            CoordinatorDriverController,
            DriverController,
            EmailController,
            FileController,
            HealthController,
            LoadController,
            MetricsController,
            LocationController,
            MobileAppController,
            OwnerController,
            OwnerDriverController,
            FacilityController,
            CustomerController,
            PersonController,
            PushController,
            TruckController,
            UserController,
          ],
          // exclude: ['file*'],
        };
      },
      inject: [ConfigService],
    }),
    ConfigModule.forRoot({
      isGlobal: true,
      cache: false,
      expandVariables: true,
      skipProcessEnv: true,
      validationSchema: EnvValidationSchema,
      load: configuration,
    }),
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', '..', 'static'),
    }),
    MongooseConnectionModule,
    ScheduleModule.forRoot(),
    AuthModule,
    HealthModule,
    MetricsModule,
    JobModule,
    GoogleGeoApiModule,
    PersonModule,
    OwnerModule,
    OwnerDriverModule,
    CoordinatorModule,
    CoordinatorDriverModule,
    DriverModule,
    FacilityModule,
    CustomerModule,
    UserModule,
    LocationModule,
    LoadModule,
    TruckModule,
    MobileAppModule,
    EmailModule,
    PushModule,
    FileModule,
    ChatModule,
  ],
})
export class AppModule implements NestModule {
  public configure(consumer: MiddlewareConsumer) {
    consumer.apply(ResponseTimeMiddleware).forRoutes(
      // { path: '*', method: RequestMethod.ALL },
      CoordinatorController,
      CoordinatorDriverController,
      DriverController,
      EmailController,
      FileController,
      HealthController,
      LoadController,
      MetricsController,
      LocationController,
      MobileAppController,
      OwnerController,
      OwnerDriverController,
      FacilityController,
      CustomerController,
      PersonController,
      PushController,
      TruckController,
      UserController,
    );
  }
}
