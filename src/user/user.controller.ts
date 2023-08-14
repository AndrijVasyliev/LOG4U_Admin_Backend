import {
  Controller,
  Get,
  Param,
  Query,
  Body,
  Post,
  Patch,
  Delete,
} from '@nestjs/common';
import {
  CreateUserDto,
  UserQuery,
  UserQuerySearch,
  UserResultDto,
  PaginatedUserResultDto,
  UpdateUserDto,
} from './user.dto';
import { BodyValidationPipe } from '../utils/bodyValidate.pipe';
import { UserService } from './user.service';
import { LoggerService } from '../logger/logger.service';
import {
  CreateUserValidation,
  UpdateUserValidation,
  UserQueryParamsSchema,
} from './user.validation';
import { MongoObjectIdPipe } from '../utils/idValidate.pipe';
import { QueryParamsPipe } from '../utils/queryParamsValidate.pipe';
import { Roles } from '../auth/auth.decorator';

@Controller('user')
@Roles('Admin', 'Super Admin')
export class UserController {
  constructor(
    private readonly log: LoggerService,
    private readonly userService: UserService,
  ) {}

  @Get()
  async getUsers(
    @Query(new QueryParamsPipe<UserQuerySearch>(UserQueryParamsSchema))
    userQuery: UserQuery,
  ): Promise<PaginatedUserResultDto> {
    return this.userService.getUsers(userQuery);
  }

  @Get(':userId')
  async getUser(
    @Param('userId', MongoObjectIdPipe) userId: string,
  ): Promise<UserResultDto> {
    return this.userService.findUser(userId);
  }

  @Post()
  @Roles('Super Admin')
  async createUser(
    @Body(new BodyValidationPipe(CreateUserValidation))
    createUserBodyDto: CreateUserDto,
  ): Promise<UserResultDto> {
    return this.userService.createUser(createUserBodyDto);
  }

  @Patch(':userId')
  @Roles('Super Admin')
  async updateUser(
    @Param('userId', MongoObjectIdPipe) userId: string,
    @Body(new BodyValidationPipe(UpdateUserValidation))
    updateUserBodyDto: UpdateUserDto,
  ): Promise<UserResultDto> {
    return this.userService.updateUser(userId, updateUserBodyDto);
  }

  @Delete(':userId')
  @Roles('Super Admin')
  async deleteUser(@Param('userId', MongoObjectIdPipe) userId: string) {
    return this.userService.deleteUser(userId);
  }
}
