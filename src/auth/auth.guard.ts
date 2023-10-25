import { ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';
import {
  ADMIN_BASIC_STRATEGY,
  MOBILE_BASIC_STRATEGY,
  IS_PUBLIC_KEY,
  USER_ROLES_KEY,
} from '../utils/constants';
import { LoggerService } from '../logger/logger.service';
import { UserRole } from '../utils/general.dto';
import { UserResultDto } from '../user/user.dto';
import { DriverResultDto } from '../driver/driver.dto';

@Injectable()
export class AdminAuthBasicGuard extends AuthGuard(ADMIN_BASIC_STRATEGY) {
  constructor(
    private reflector: Reflector,
    private readonly log: LoggerService,
  ) {
    super();
  }
  async canActivate(context: ExecutionContext): Promise<boolean> {
    this.log.debug('In Admin Auth Guard');
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      this.log.debug('Public endpoint');
      return true;
    }
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(
      USER_ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );
    this.log.verbose(`Roles ${JSON.stringify(requiredRoles)}`);
    if (!requiredRoles) {
      this.log.debug('Admin: Not Public End empty roles');
      return false;
    }
    if (requiredRoles.includes('Driver')) {
      this.log.debug('Mobile endpoint');
      return true;
    }
    this.log.debug(`Roles ${JSON.stringify(requiredRoles)}`);
    await super.canActivate(context);
    const { user } = context.switchToHttp().getRequest() as {
      user: UserResultDto | Record<string, never>;
    };
    this.log.debug(`User ${JSON.stringify(user)}`);
    if (requiredRoles.some((requiredRole) => requiredRole === user?.userRole)) {
      return true;
    }
    return false;
  }
}

@Injectable()
export class MobileAuthBasicGuard extends AuthGuard(MOBILE_BASIC_STRATEGY) {
  constructor(
    private reflector: Reflector,
    private readonly log: LoggerService,
  ) {
    super();
  }
  async canActivate(context: ExecutionContext): Promise<boolean> {
    this.log.debug('In Mobile Auth Guard');
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      this.log.debug('Public endpoint');
      return true;
    }
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(
      USER_ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );
    this.log.debug(`Roles ${JSON.stringify(requiredRoles)}`);
    if (!requiredRoles) {
      this.log.debug(' Mobile: Not Public End empty roles');
      return false;
    }
    if (
      requiredRoles.includes('Admin') ||
      requiredRoles.includes('Super Admin')
    ) {
      this.log.debug('Admin endpoint');
      return true;
    }
    await super.canActivate(context);
    const { user } = context.switchToHttp().getRequest() as {
      user: DriverResultDto | Record<string, never>;
    };
    this.log.debug(`Driver ${JSON.stringify(user)}`);
    return true;
  }
}
