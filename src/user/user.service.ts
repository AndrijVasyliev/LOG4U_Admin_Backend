import { mongo, PaginateModel, PaginateOptions } from 'mongoose';
import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { LoggerService } from '../logger/logger.service';
import {
  MONGO_CONNECTION_NAME,
  MONGO_UNIQUE_INDEX_CONFLICT,
  UNIQUE_CONSTRAIN_ERROR,
} from '../utils/constants';
import { User, UserDocument } from './user.schema';
import {
  CreateUserDto,
  UserQuery,
  UserResultDto,
  PaginatedUserResultDto,
  UpdateUserDto,
} from './user.dto';
import { escapeForRegExp } from '../utils/escapeForRegExp';

const { MongoError } = mongo;

@Injectable()
export class UserService {
  constructor(
    @InjectModel(User.name, MONGO_CONNECTION_NAME)
    private readonly userModel: PaginateModel<UserDocument>,
    private readonly log: LoggerService,
  ) {}

  private async findUserDocumentById(id: string): Promise<UserDocument> {
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

  async findUserById(id: string): Promise<UserResultDto> {
    const user = await this.findUserDocumentById(id);
    return UserResultDto.fromUserModel(user);
  }

  async getUsers(query: UserQuery): Promise<PaginatedUserResultDto> {
    this.log.debug(`Searching for Users: ${JSON.stringify(query)}`);

    const documentQuery: Parameters<typeof this.userModel.paginate>[0] = {};
    if (query.search) {
      const searchParams = Object.entries(query.search);
      searchParams.forEach((entry) => {
        documentQuery[entry[0]] = {
          $regex: new RegExp(escapeForRegExp(entry[1]), 'i'),
        };
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

    try {
      this.log.debug('Saving User');
      const user = await createdUser.save();
      return UserResultDto.fromUserModel(user);
    } catch (e) {
      if (!(e instanceof Error)) {
        throw new InternalServerErrorException(JSON.stringify(e));
      }
      if (e instanceof MongoError && e.code === MONGO_UNIQUE_INDEX_CONFLICT) {
        throw new ConflictException({ type: UNIQUE_CONSTRAIN_ERROR, e });
      }
      throw new InternalServerErrorException(e.message);
    }
  }

  async updateUser(
    id: string,
    updateUserDto: UpdateUserDto,
  ): Promise<UserResultDto> {
    const user = await this.findUserDocumentById(id);
    this.log.debug(`Setting new values: ${JSON.stringify(updateUserDto)}`);
    Object.assign(user, updateUserDto);
    try {
      this.log.debug('Saving User');
      const savedUser = await user.save();
      this.log.debug(`User ${savedUser._id} saved`);
      return UserResultDto.fromUserModel(user);
    } catch (e) {
      if (!(e instanceof Error)) {
        throw new InternalServerErrorException(JSON.stringify(e));
      }
      if (e instanceof MongoError && e.code === MONGO_UNIQUE_INDEX_CONFLICT) {
        throw new ConflictException({ type: UNIQUE_CONSTRAIN_ERROR, e });
      }
      throw new InternalServerErrorException(e.message);
    }
  }

  async deleteUser(id: string): Promise<UserResultDto> {
    const user = await this.findUserDocumentById(id);

    this.log.debug(`Deleting User ${user._id}`);

    try {
      await user.deleteOne();
      this.log.debug('User deleted');
    } catch (e) {
      if (!(e instanceof Error)) {
        throw new InternalServerErrorException(JSON.stringify(e));
      }
      throw new InternalServerErrorException(e.message);
    }
    return UserResultDto.fromUserModel(user);
  }
}
