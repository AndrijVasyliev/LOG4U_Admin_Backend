import * as fs from 'node:fs';
import { Controller, Get, InternalServerErrorException } from '@nestjs/common';
import {
  HealthCheck,
  HealthCheckService,
  MemoryHealthIndicator,
  MongooseHealthIndicator,
} from '@nestjs/terminus';
import {
  HEALTH_MEMORY_HEAP_LIMIT,
  HEALTH_MEMORY_RSS_LIMIT,
} from '../utils/constants';

import { LoggerService } from '../logger/logger.service';
import { Public } from '../auth/auth.decorator';
import { ConfigService } from '@nestjs/config';

function getVersionFromStatusFile() {
  try {
    return fs.readFileSync('status.json').toString();
    // eslint-disable-next-line no-empty
  } catch (e) {}
}

function getVersionFromPackageJson() {
  try {
    const file = fs.readFileSync('package.json');
    return JSON.parse(file.toString())['version'];
  } catch (e) {}
}

const fileVersion = getVersionFromStatusFile();
const defaultVersion = getVersionFromPackageJson();

@Controller()
@Public()
export class HealthController {
  readonly heapLimit: number;
  readonly rssLimit: number;
  constructor(
    private readonly health: HealthCheckService,
    private readonly memory: MemoryHealthIndicator,
    private readonly mongoose: MongooseHealthIndicator,
    private readonly configService: ConfigService,
    private readonly log: LoggerService,
  ) {
    this.heapLimit =
      this.configService.get<number>('app.heapLimit') ||
      HEALTH_MEMORY_HEAP_LIMIT;
    this.rssLimit =
      this.configService.get<number>('app.rssLimit') || HEALTH_MEMORY_RSS_LIMIT;
  }

  @Get('/liveness')
  checkLiveness() {
    this.log.silly('Liveness check');
    return 'OK';
  }

  @Get('/readiness')
  async checkReadiness() {
    const healthCheckResult = await this.health.check([
      () => this.memory.checkHeap('memory_heap', this.heapLimit),
      () => this.memory.checkRSS('memory_rss', this.rssLimit),
      async () => this.mongoose.pingCheck('mongoose'),
    ]);
    this.log.silly(`Readiness check ${JSON.stringify(healthCheckResult)}`);
    if (healthCheckResult.status === 'ok') {
      return 'OK';
    }
    throw new InternalServerErrorException('Service not ready');
  }

  @Get('/status')
  getStatus() {
    let result = '# GET current build/version number\nbuild_info';
    if (fileVersion) {
      result += fileVersion;
    } else {
      result += `{version=${defaultVersion}}`;
    }
    this.log.silly(`Status ${result}`);
    return result;
  }

  @Get('/health')
  @HealthCheck()
  async check() {
    const healthCheckResult = this.health.check([
      () => this.memory.checkHeap('memory_heap', this.heapLimit),
      () => this.memory.checkRSS('memory_rss', this.rssLimit),
      async () => this.mongoose.pingCheck('mongoose'),
    ]);
    this.log.silly(`Health check ${JSON.stringify(healthCheckResult)}`);
    return healthCheckResult;
  }
}
