import { PaginateResult } from 'mongoose';
import { User } from './user.schema';
import { Query, PaginatedResultDto, UserRole } from '../utils/general.dto';

export class CreateUserDto {
    readonly fullName: string;
    readonly phone?: string;
    readonly userRole: UserRole;
    readonly jobTitle: string;
    readonly email: string;
    readonly password: string;
}

export class UpdateUserDto {
    readonly fullName?: string;
    readonly phone?: string;
    readonly userRole?: UserRole;
    readonly jobTitle?: string;
    readonly email?: string;
    readonly password?: string;
}

export class UserQuerySearch {
    readonly fullName?: string;
    readonly phone?: string;
    readonly userRole?: UserRole;
    readonly jobTitle?: string;
    readonly email?: string;
    readonly password?: string;
}

export class UserQuery extends Query<UserQuerySearch>{
}

export class UserResultDto extends CreateUserDto{
    static fromUserModel(user: User): UserResultDto {
        return {
            id: user._id.toString(),
            fullName: user.fullName,
            phone: user.phone,
            userRole: user.userRole,
            jobTitle: user.jobTitle,
            email: user.email,
            password: user.password,
        };
    }

    readonly id: string;
}

export class PaginatedUserResultDto extends PaginatedResultDto<UserResultDto> {
    static from(paginatedUsers: PaginateResult<User>): PaginatedUserResultDto {
        return {
            items: paginatedUsers.docs.map((user) => (UserResultDto.fromUserModel(user))),
            offset: paginatedUsers.offset,
            limit: paginatedUsers.limit,
            total: paginatedUsers.totalDocs,
        };
    }
}
