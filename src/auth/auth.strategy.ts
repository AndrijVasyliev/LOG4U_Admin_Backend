import { BasicStrategy as Strategy } from 'passport-http';
import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { UserService } from '../user/user.service';
import { UserResultDto } from '../user/user.dto';
import { DriverService } from '../driver/driver.service';
import { DriverResultDto } from '../driver/driver.dto';
import { LoggerService } from '../logger/logger.service';
import {
  ADMIN_BASIC_STRATEGY,
  MOBILE_BASIC_STRATEGY,
} from '../utils/constants';

@Injectable()
export class AdminAuthBasicStrategy extends PassportStrategy(
  Strategy,
  ADMIN_BASIC_STRATEGY,
) {
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
    this.log.debug('In Admin Basic Auth strategy');
    return this.userService.getUserByCredentials(username, password);
  };
}

@Injectable()
export class MobileAuthBasicStrategy extends PassportStrategy(
  Strategy,
  MOBILE_BASIC_STRATEGY,
) {
  constructor(
    private readonly log: LoggerService,
    private readonly driverService: DriverService,
  ) {
    super();
  }

  public validate = async (
    username: string,
    password: string,
  ): Promise<DriverResultDto | null> => {
    this.log.debug('In Mobile Basic Auth strategy');
    return await this.driverService.getDriverByCredentials(username, password);
  };
}
