import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import {
  AdminAuthBasicStrategy,
  MobileAuthBasicStrategy,
} from './auth.strategy';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { AdminAuthBasicGuard, MobileAuthBasicGuard } from './auth.guard';
import { UserModule } from '../user/user.module';
import { DriverModule } from '../driver/driver.module';

@Module({
  imports: [PassportModule, ConfigModule, UserModule, DriverModule],
  providers: [
    AdminAuthBasicStrategy,
    MobileAuthBasicStrategy,
    {
      provide: APP_GUARD,
      useClass: AdminAuthBasicGuard,
    },
    {
      provide: APP_GUARD,
      useClass: MobileAuthBasicGuard,
    },
  ],
})
export class AuthModule {}
