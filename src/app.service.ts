import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LoggerService } from './logger/logger.service';

@Injectable()
export class AppService {
  constructor(
    private configService: ConfigService,
    private log: LoggerService,
  ) {}

  getRoot(): string {
    this.log.debug('In App Root');
    return 'OK';
  }
}
