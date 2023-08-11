import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { AuthBasicStrategy } from './auth.strategy';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { AuthBasicGuard } from './auth.guard';
import { UserModule } from '../user/user.module';

@Module({
  imports: [PassportModule, ConfigModule, UserModule],
  providers: [
    AuthBasicStrategy,
    {
      provide: APP_GUARD,
      useClass: AuthBasicGuard,
    },
  ],
})
export class AuthModule {}
