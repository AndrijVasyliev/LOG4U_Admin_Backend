import { PrometheusController } from '@willsoto/nestjs-prometheus';
import { Controller, Get, Res } from '@nestjs/common';
import { Response } from 'express';
import { LoggerService } from '../logger';
import { Public } from '../auth/auth.decorator';
import { DoNotCollectMetrics } from './metrics.decorator';

@Controller('metrics')
@Public()
@DoNotCollectMetrics()
export class MetricsController extends PrometheusController {
  constructor(private readonly log: LoggerService,) {
    super();
  }
  @Get()
  async index(@Res({ passthrough: true }) response: Response) {
    this.log.debug('Getting metrics');
    return super.index(response);
  }
}
