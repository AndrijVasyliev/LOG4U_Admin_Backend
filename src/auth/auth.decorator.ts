import { SetMetadata } from '@nestjs/common';
import { IS_PUBLIC_KEY, USER_ROLES_KEY } from '../utils/constants';
import { UserRole } from '../utils/general.dto';

export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
export const Roles = (...roles: UserRole[]) =>
  SetMetadata(USER_ROLES_KEY, roles);
