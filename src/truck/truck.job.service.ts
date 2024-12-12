import { PaginateModel } from 'mongoose';
import {
  Injectable,
  OnApplicationBootstrap,
  OnModuleDestroy,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ConfigService } from '@nestjs/config';
import { SchedulerRegistry } from '@nestjs/schedule';
import { Truck, TruckDocument } from './truck.schema';
import { LoggerService } from '../logger';
import { PushService } from '../push/push.service';
import {
  MONGO_CONNECTION_NAME,
  TRUCK_SET_AVAIL_STATUS_JOB,
  TRUCK_SEND_RENEW_LOCATION_PUSH_JOB,
} from '../utils/constants';

@Injectable()
export class TruckJobService
  implements OnApplicationBootstrap, OnModuleDestroy
{
  private readonly resetToAvailableOlderThen: number;
  private readonly locationUpdatedLaterThen: number;
  constructor(
    @InjectModel(Truck.name, MONGO_CONNECTION_NAME)
    private readonly truckModel: PaginateModel<TruckDocument>,
    private readonly pushService: PushService,
    private readonly configService: ConfigService,
    private readonly log: LoggerService,
    private schedulerRegistry: SchedulerRegistry,
  ) {
    this.resetToAvailableOlderThen = configService.get<number>(
      'trucks.resetToAvailableWillBeOlderThen',
    ) as number;
    this.locationUpdatedLaterThen = configService.get<number>(
      'trucks.sendRenewLocationPushOlderThen',
    ) as number;
  }

  onApplicationBootstrap(): void {
    this.log.debug('Starting set "Available" job');
    const restartSetAvailableIntervalValue = this.configService.get<number>(
      'trucks.taskSetAvailableInterval',
    ) as number;
    const setAvailInterval = setInterval(() => {
      this.resetToAvailableStatus.bind(this)();
    }, restartSetAvailableIntervalValue);
    this.schedulerRegistry.addInterval(
      TRUCK_SET_AVAIL_STATUS_JOB,
      setAvailInterval,
    );

    this.log.debug('Starting send renew location push job');
    const restartSendPushIntervalValue = this.configService.get<number>(
      'trucks.taskSendRenewLocationPushInterval',
    ) as number;
    const setSendPushInterval = setInterval(() => {
      this.sendRenewLocationPush.bind(this)();
    }, restartSendPushIntervalValue);
    this.schedulerRegistry.addInterval(
      TRUCK_SEND_RENEW_LOCATION_PUSH_JOB,
      setSendPushInterval,
    );
  }

  async onModuleDestroy(): Promise<void> {
    this.log.debug('Stopping set "Available" status job');
    clearInterval(
      this.schedulerRegistry.getInterval(TRUCK_SET_AVAIL_STATUS_JOB),
    );
    this.log.debug('Stopping send update location push job');
    clearInterval(
      this.schedulerRegistry.getInterval(TRUCK_SEND_RENEW_LOCATION_PUSH_JOB),
    );
  }

  private async resetToAvailableStatus(): Promise<void> {
    this.log.info(
      'Setting "Available" status to "Will be available" from past',
    );
    const willBeAvailableLaterThenDate = new Date(
      Date.now() - this.resetToAvailableOlderThen,
    );
    this.log.info(
      `Try to set "Available" to trucks "Will be available" later then ${willBeAvailableLaterThenDate}`,
    );
    const result = await this.truckModel.updateMany(
      {
        status: { $eq: 'Will be available' },
        availabilityAt: { $lte: willBeAvailableLaterThenDate },
      },
      [
        {
          $set: {
            status: 'Available',
            searchLocation: '$lastLocation',
          },
        },
        {
          $unset: [
            'availabilityLocation',
            'availabilityAt',
            'availabilityAtLocal',
          ],
        },
      ],
    );
    this.log.info(
      `Updated ${result.modifiedCount === 1 ? '1 truck' : result.modifiedCount + ' trucks'} status`,
    );
    return;
  }

  private async sendRenewLocationPush(): Promise<void> {
    let wasFound = false;
    let processedCount = 0;
    this.log.info('Starting to find trucks and send push`s');
    do {
      const locationUpdatedLaterThenDate = new Date(
        Date.now() - this.locationUpdatedLaterThen,
      );
      this.log.info(
        `Finding truck with location updated later then ${locationUpdatedLaterThenDate}`,
      );
      const truck = await this.truckModel.findOneAndUpdate(
        {
          status: 'Available',
          $and: [
            {
              $or: [
                { locationUpdatedAt: { $exists: false } },
                { locationUpdatedAt: { $eq: null } },
                { locationUpdatedAt: { $lte: locationUpdatedLaterThenDate } },
              ],
            },
            {
              $or: [
                { renewLocationPushMessageAt: { $exists: false } },
                { renewLocationPushMessageAt: { $eq: null } },
                {
                  $expr: {
                    $lt: ['$renewLocationPushMessageAt', '$locationUpdatedAt'],
                  },
                },
              ],
            },
          ],
        },
        [
          {
            $set: {
              renewLocationPushMessageAt: new Date(),
              status: 'Not Available',
            },
          },
        ],
      );
      if (truck) {
        this.log.info(
          `Found truck: ${truck._id} with location updated ${truck.locationUpdatedAt}`,
        );
        wasFound = true;
        const driverId = truck.driver?._id;
        if (driverId) {
          const newPushMessage = await this.pushService.createPush({
            to: driverId,
            title: 'Please update your truck status.',
            body: 'To receive a load offer, please update your app by clicking on this message and setting your status to Available.',
            data: {
              context: {
                driverId: driverId,
                truckId: truck.id,
              },
            },
          });
          await this.pushService.updatePush(newPushMessage.id, {
            state: 'Ready for send',
          });
        }
        ++processedCount;
      } else {
        wasFound = false;
      }
    } while (wasFound);
    this.log.info(`Processed count ${processedCount}`);
    return;
  }
}
