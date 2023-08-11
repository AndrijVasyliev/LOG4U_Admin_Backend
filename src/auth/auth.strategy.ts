import { BasicStrategy as Strategy } from 'passport-http';
import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { UserService } from '../user/user.service';
import { UserResultDto } from '../user/user.dto';
import { LoggerService } from '../logger/logger.service';

@Injectable()
export class AuthBasicStrategy extends PassportStrategy(Strategy, 'basic') {
  constructor(
    private readonly log: LoggerService,
    private readonly userService: UserService,
  ) {
    super();
  }

  public validate = async (
    username: string,
    password: string,
  ): Promise<UserResultDto | null> => {
    this.log.debug('In Basic Auth strategy');
    return this.userService.getUserByCredentials(username, password);
  };
}
