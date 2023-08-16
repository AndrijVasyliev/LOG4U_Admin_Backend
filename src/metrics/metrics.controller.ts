import { PrometheusController } from '@willsoto/nestjs-prometheus';
import { Controller, Get, Res } from '@nestjs/common';
import { Response } from 'express';
import { Public } from '../auth/auth.decorator';

@Controller('metrics')
@Public()
export class MetricsController extends PrometheusController {
  @Get()
  async index(@Res({ passthrough: true }) response: Response) {
    return super.index(response);
  }
}
