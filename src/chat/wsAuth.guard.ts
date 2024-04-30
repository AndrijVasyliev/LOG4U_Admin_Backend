import { ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
  ADMIN_ROLES,
  IS_PUBLIC_KEY,
  MOBILE_BASIC_STRATEGY,
  USER_ROLES_KEY,
} from '../utils/constants';
import { Reflector } from '@nestjs/core';
import { LoggerService } from '../logger';
import { UserRole } from '../utils/general.dto';
import { PersonAuthResultDto } from '../person/person.dto';

@Injectable()
export class WsMobileAuthBasicGuard extends AuthGuard(MOBILE_BASIC_STRATEGY) {
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
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-expect-error
      requiredRoles.every((requiredRole) => ADMIN_ROLES.includes(requiredRole))
    ) {
      this.log.debug('Admin endpoint');
      return true;
    }
    await super.canActivate(context);
    const { user } = context.switchToHttp().getRequest() as {
      user: PersonAuthResultDto | Record<string, never>;
    };
    this.log.debug(`Person ${JSON.stringify(user)}`);
    if (requiredRoles.some((requiredRole) => requiredRole === user?.type)) {
      return true;
    }
    return false;
  }
}
