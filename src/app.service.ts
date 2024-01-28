import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LoggerService } from './logger/logger.service';

@Injectable()
export class AppService {
  constructor(
    private readonly configService: ConfigService,
    private readonly log: LoggerService,
  ) {}

  getRoot(): string {
    this.log.debug('In App Root');
    return 'OK';
  }
}
