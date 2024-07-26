import { PaginateResult } from 'mongoose';
import { User } from './user.schema';
import { Query, PaginatedResultDto, AdminRole } from '../utils/general.dto';
import { CoordinatorQuerySearch } from '../coordinator/coordinator.dto';

export interface CreateUserDto {
  readonly fullName: string;
  readonly phone?: string;
  readonly userRole: AdminRole;
  readonly jobTitle: string;
  readonly email: string;
  readonly password: string;
}

export interface UpdateUserDto {
  readonly fullName?: string;
  readonly phone?: string;
  readonly userRole?: AdminRole;
  readonly jobTitle?: string;
  readonly email?: string;
  readonly password?: string;
}

export interface UserQuerySearch {
  readonly search?: string;
  readonly fullName?: string;
  readonly phone?: string;
  readonly userRole?: AdminRole;
  readonly jobTitle?: string;
  readonly email?: string;
  // readonly password?: string;
}

export interface UserQueryOrder
  extends Omit<UserQuerySearch, 'search' | 'password'> {}

export interface UserQuery extends Query<UserQuerySearch, UserQueryOrder> {}

export class UserResultDto {
  static fromUserModel(user: User): UserResultDto {
    return {
      id: user._id.toString(),
      fullName: user.fullName,
      phone: user.phone,
      userRole: user.userRole,
      jobTitle: user.jobTitle,
      email: user.email,
    };
  }

  readonly id: string;
  readonly fullName: string;
  readonly phone?: string;
  readonly userRole: AdminRole;
  readonly jobTitle: string;
  readonly email: string;
}

export class PaginatedUserResultDto extends PaginatedResultDto<UserResultDto> {
  static from(paginatedUsers: PaginateResult<User>): PaginatedUserResultDto {
    return {
      items: paginatedUsers.docs.map((user) =>
        UserResultDto.fromUserModel(user),
      ),
      offset: paginatedUsers.offset,
      limit: paginatedUsers.limit,
      total: paginatedUsers.totalDocs,
    };
  }
}
