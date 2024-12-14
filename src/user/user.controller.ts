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
import { Types } from 'mongoose';
import {
  CreateUserDto,
  UserQuery,
  UserResultDto,
  PaginatedUserResultDto,
  UpdateUserDto,
} from './user.dto';
import { UserService } from './user.service';
import {
  CreateUserValidationSchema,
  UpdateUserValidationSchema,
  UserQueryParamsSchema,
} from './user.validation';
import { LoggerService } from '../logger';
import { MongoObjectIdPipe } from '../utils/idValidate.pipe';
import { BodySchemaPipe } from '../utils/bodyValidate.pipe';
import { QueryParamsSchemaPipe } from '../utils/queryParamsValidate.pipe';
import { User } from '../utils/user.decorator';
import { Roles } from '../auth/auth.decorator';

@Controller('user')
@Roles('Admin', 'Super Admin')
export class UserController {
  constructor(
    private readonly log: LoggerService,
    private readonly userService: UserService,
  ) {}

  @Get('auth')
  async auth(@User() user: UserResultDto): Promise<UserResultDto> {
    return user;
  }

  @Get()
  async getUsers(
    @Query(new QueryParamsSchemaPipe(UserQueryParamsSchema))
    userQuery: UserQuery,
  ): Promise<PaginatedUserResultDto> {
    return this.userService.getUsers(userQuery);
  }

  @Get(':userId')
  async getUser(
    @Param('userId', MongoObjectIdPipe) userId: Types.ObjectId,
  ): Promise<UserResultDto> {
    return this.userService.findUserById(userId);
  }

  @Post()
  @Roles('Super Admin')
  async createUser(
    @Body(new BodySchemaPipe(CreateUserValidationSchema))
    createUserBodyDto: CreateUserDto,
  ): Promise<UserResultDto> {
    return this.userService.createUser(createUserBodyDto);
  }

  @Patch(':userId')
  @Roles('Super Admin')
  async updateUser(
    @Param('userId', MongoObjectIdPipe) userId: Types.ObjectId,
    @Body(new BodySchemaPipe(UpdateUserValidationSchema))
    updateUserBodyDto: UpdateUserDto,
  ): Promise<UserResultDto> {
    return this.userService.updateUser(userId, updateUserBodyDto);
  }

  @Delete(':userId')
  @Roles('Super Admin')
  async deleteUser(@Param('userId', MongoObjectIdPipe) userId: Types.ObjectId) {
    return this.userService.deleteUser(userId);
  }
}
