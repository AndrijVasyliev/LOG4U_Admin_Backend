import { PaginateModel, PaginateOptions, Types } from 'mongoose';
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { LoggerService } from '../logger';
import { MONGO_CONNECTION_NAME } from '../utils/constants';
import { User, UserDocument } from './user.schema';
import {
  CreateUserDto,
  UserQuery,
  UserResultDto,
  PaginatedUserResultDto,
  UpdateUserDto,
} from './user.dto';
import { escapeForRegExp } from '../utils/escapeForRegExp';

@Injectable()
export class UserService {
  constructor(
    @InjectModel(User.name, MONGO_CONNECTION_NAME)
    private readonly userModel: PaginateModel<UserDocument>,
    private readonly log: LoggerService,
  ) {}

  private async findUserDocumentById(id: Types.ObjectId): Promise<UserDocument> {
    this.log.debug(`Searching for User ${id}`);
    const user = await this.userModel.findOne({ _id: id });
    if (!user) {
      throw new NotFoundException(`User ${id} was not found`);
    }
    this.log.debug(`User ${user._id}`);

    return user;
  }

  async getUserByCredentials(
    email: string,
    password: string,
  ): Promise<UserResultDto | null> {
    this.log.debug(`Searching for User by email ${email}`);
    const user = await this.userModel.findOne({
      email,
      password,
    });
    if (!user) {
      this.log.debug(`User with email ${email} was not found`);
      return null;
    }
    this.log.debug(`User ${user._id}`);
    return UserResultDto.fromUserModel(user);
  }

  async findUserById(id: Types.ObjectId): Promise<UserResultDto> {
    const user = await this.findUserDocumentById(id);
    return UserResultDto.fromUserModel(user);
  }

  async getUsers(query: UserQuery): Promise<PaginatedUserResultDto> {
    this.log.debug(`Searching for Users: ${JSON.stringify(query)}`);

    const documentQuery: Parameters<typeof this.userModel.paginate>[0] = {};
    if (query.search) {
      const searchParams = Object.entries(query.search);
      searchParams.forEach((entry) => {
        entry[0] !== 'search' &&
          (documentQuery[entry[0]] = {
            $regex: new RegExp(escapeForRegExp(entry[1]), 'i'),
          });
      });
    }
    if (query?.search?.search) {
      const search = escapeForRegExp(query?.search?.search);
      documentQuery.$or = [
        { fullName: { $regex: new RegExp(search, 'i') } },
        { phone: { $regex: new RegExp(search, 'i') } },
        { email: { $regex: new RegExp(search, 'i') } },
      ];
    }

    const options: PaginateOptions = {
      limit: query.limit,
      offset: query.offset,
    };
    if (query.direction && query.orderby) {
      options.sort = { [query.orderby]: query.direction };
    }

    const res = await this.userModel.paginate(documentQuery, options);

    return PaginatedUserResultDto.from(res);
  }

  async createUser(createUserDto: CreateUserDto): Promise<UserResultDto> {
    this.log.debug(`Creating new User: ${JSON.stringify(createUserDto)}`);
    const createdUser = new this.userModel(createUserDto);

    this.log.debug('Saving User');
    const user = await createdUser.save();
    return UserResultDto.fromUserModel(user);
  }

  async updateUser(
    id: Types.ObjectId,
    updateUserDto: UpdateUserDto,
  ): Promise<UserResultDto> {
    const user = await this.findUserDocumentById(id);
    this.log.debug(`Setting new values: ${JSON.stringify(updateUserDto)}`);
    Object.assign(user, updateUserDto);
    this.log.debug('Saving User');
    const savedUser = await user.save();
    this.log.debug(`User ${savedUser._id} saved`);
    return UserResultDto.fromUserModel(user);
  }

  async deleteUser(id: Types.ObjectId): Promise<UserResultDto> {
    const user = await this.findUserDocumentById(id);

    this.log.debug(`Deleting User ${user._id}`);

    await user.deleteOne();
    this.log.debug('User deleted');

    return UserResultDto.fromUserModel(user);
  }
}
