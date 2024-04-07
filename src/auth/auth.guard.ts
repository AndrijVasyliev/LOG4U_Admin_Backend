import { ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';
import {
  ADMIN_BASIC_STRATEGY,
  MOBILE_BASIC_STRATEGY,
  IS_PUBLIC_KEY,
  USER_ROLES_KEY,
  ADMIN_ROLES,
  MOBILE_ROLES,
  API_PATH_PREFIX, MOBILE_PATH_PREFIX,
} from '../utils/constants';
import { LoggerService } from '../logger';
import { UserRole } from '../utils/general.dto';
import { UserResultDto } from '../user/user.dto';
import { PersonAuthResultDto } from '../person/person.dto';

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
    const request = context.switchToHttp().getRequest() as Request;
    if (request.url.startsWith(`/${API_PATH_PREFIX}`)) {
      const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(
        USER_ROLES_KEY,
        [context.getHandler(), context.getClass()],
      );
      this.log.verbose(`Roles ${JSON.stringify(requiredRoles)}`);
      if (!requiredRoles) {
        this.log.debug('Admin: Not Public End empty roles');
        return false;
      }
      await super.canActivate(context);
      const { user } = context.switchToHttp().getRequest() as {
        user: UserResultDto | Record<string, never>;
      };
      this.log.debug(`User ${JSON.stringify(user)}`);
      if (
        requiredRoles.some((requiredRole) => requiredRole === user?.userRole)
      ) {
        return true;
      }
      return false;
    }
    this.log.debug('Not Admin endpoint. Passing.');
    return true;
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
    const request = context.switchToHttp().getRequest() as Request;
    if (request.url.startsWith(`/${MOBILE_PATH_PREFIX}`)) {
      const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(
        USER_ROLES_KEY,
        [context.getHandler(), context.getClass()],
      );
      this.log.verbose(`Roles ${JSON.stringify(requiredRoles)}`);
      if (!requiredRoles) {
        this.log.debug('Mobile: Not Public End empty roles');
        return false;
      }
      await super.canActivate(context);
      const { user } = context.switchToHttp().getRequest() as {
        user: PersonAuthResultDto | Record<string, never>;
      };
      this.log.debug(`User ${JSON.stringify(user)}`);
      if (requiredRoles.some((requiredRole) => requiredRole === user?.type)) {
        return true;
      }
      return false;
    }
    this.log.debug('Not Mobile App endpoint. Passing.');
    return true;
  }
}
