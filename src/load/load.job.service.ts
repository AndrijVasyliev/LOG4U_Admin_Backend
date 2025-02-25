import { PaginateModel } from 'mongoose';
import {
  Injectable,
  OnApplicationBootstrap,
  OnApplicationShutdown,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ConfigService } from '@nestjs/config';
import { SchedulerRegistry } from '@nestjs/schedule';
import { Load, LoadDocument } from './load.schema';
import { LoggerService } from '../logger';
import {
  MONGO_CONNECTION_NAME,
  LOAD_CALCULATE_TRUCK_RPM_AVG_JOB,
} from '../utils/constants';

@Injectable()
export class LoadJobService implements OnApplicationBootstrap, OnApplicationShutdown {
  constructor(
    @InjectModel(Load.name, MONGO_CONNECTION_NAME)
    private readonly loadModel: PaginateModel<LoadDocument>,
    private readonly configService: ConfigService,
    private readonly log: LoggerService,
    private schedulerRegistry: SchedulerRegistry,
  ) {}

  onApplicationBootstrap(): void {
    this.log.debug('Starting calculate truck RPM avg job');
    const restartCalculateTruckRpmAvgIntervalValue =
      this.configService.get<number>(
        'load.taskCalculateTruckRpmAvgInterval',
      ) as number;
    const calculateTruckRpmAvgInterval = setInterval(() => {
      this.calculateTruckRpmAvg.bind(this)();
    }, restartCalculateTruckRpmAvgIntervalValue);
    this.schedulerRegistry.addInterval(
      LOAD_CALCULATE_TRUCK_RPM_AVG_JOB,
      calculateTruckRpmAvgInterval,
    );
  }

  async onApplicationShutdown(): Promise<void> {
    this.log.debug('Stopping calculate truck RPM avg job');
    clearInterval(
      this.schedulerRegistry.getInterval(LOAD_CALCULATE_TRUCK_RPM_AVG_JOB),
    );
  }

  private async calculateTruckRpmAvg(): Promise<void> {
    this.log.info('Calculating truck`s average RPM');
    await this.loadModel.aggregate([
      {
        $match: {
          status: 'Completed',
        },
      },
      {
        $group: {
          _id: '$truck',
          rpmAvg: { $avg: '$rpm' },
        },
      },
      {
        $merge: {
          into: 'trucks',
          whenMatched: 'merge',
          whenNotMatched: 'discard',
        },
      },
    ]);
    this.log.info('Finished calculating truck`s average RPM');
    return;
  }
}
