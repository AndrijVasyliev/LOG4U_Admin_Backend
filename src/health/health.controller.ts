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
export class HealthController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly memory: MemoryHealthIndicator,
    private readonly mongoose: MongooseHealthIndicator,
    private readonly log: LoggerService,
  ) {}

  @Get('/liveness')
  checkLiveness() {
    this.log.silly('Liveness check');
    return 'OK';
  }

  @Get('/readiness')
  async checkReadiness() {
    const healthCheckResult = await this.health.check([
      () => this.memory.checkHeap('memory_heap', HEALTH_MEMORY_HEAP_LIMIT),
      () => this.memory.checkRSS('memory_rss', HEALTH_MEMORY_RSS_LIMIT),
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
      () => this.memory.checkHeap('memory_heap', HEALTH_MEMORY_HEAP_LIMIT),
      () => this.memory.checkRSS('memory_rss', HEALTH_MEMORY_RSS_LIMIT),
      async () => this.mongoose.pingCheck('mongoose'),
    ]);
    this.log.silly(`Health check ${JSON.stringify(healthCheckResult)}`);
    return healthCheckResult;
  }
}
