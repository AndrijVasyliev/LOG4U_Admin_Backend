import { ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY, USER_ROLES_KEY } from '../utils/constants';
import { LoggerService } from '../logger/logger.service';
import { UserRole } from '../utils/general.dto';
import { UserResultDto } from '../user/user.dto';

@Injectable()
export class AuthBasicGuard extends AuthGuard('basic') {
  constructor(
    private reflector: Reflector,
    private readonly log: LoggerService,
  ) {
    super();
  }
  async canActivate(context: ExecutionContext): Promise<boolean> {
    this.log.debug('In Auth Guard');
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      this.log.debug('Public endpoint');
      return true;
    }
    await super.canActivate(context);
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(
      USER_ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );
    this.log.debug(`Roles ${JSON.stringify(requiredRoles)}`);
    const { user } = context.switchToHttp().getRequest() as {
      user: UserResultDto;
    };
    this.log.debug(`User ${JSON.stringify(user)}`);
    if (requiredRoles.some((requiredRole) => requiredRole === user.userRole)) {
      return true;
    }
    return false;
  }
}
