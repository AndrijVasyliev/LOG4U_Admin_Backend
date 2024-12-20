import { mongo, PaginateModel } from 'mongoose';
import {
  Injectable,
  OnApplicationBootstrap,
  OnModuleDestroy,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ConfigService } from '@nestjs/config';
import { Truck, TruckDocument } from './truck.schema';
import { TruckChangeDocument } from './truck.dto';
import { LoggerService } from '../logger';
import { GoogleGeoApiService } from '../googleGeoApi/googleGeoApi.service';
import { MONGO_CONNECTION_NAME } from '../utils/constants';
import { ChangeDocument, Queue } from '../utils/queue';

const { ChangeStream } = mongo;

@Injectable()
export class TruckWorkerService
  implements OnApplicationBootstrap, OnModuleDestroy
{
  private readonly trucksChangeStream?: InstanceType<typeof ChangeStream>;
  private trucksQueue?: Queue<ChangeDocument & TruckChangeDocument>;
  constructor(
    @InjectModel(Truck.name, MONGO_CONNECTION_NAME)
    private readonly truckModel: PaginateModel<TruckDocument>,
    private readonly geoApiService: GoogleGeoApiService,
    private readonly configService: ConfigService,
    private readonly log: LoggerService,
  ) {
    this.trucksChangeStream = truckModel.watch([
      {
        $match: {
          $or: [
            {
              operationType: 'insert',
              $or: [
                {
                  'fullDocument.availabilityAtLocal': {
                    $exists: true,
                    $ne: null,
                  },
                },
                {
                  'fullDocument.availabilityLocation': {
                    $exists: true,
                    $ne: null,
                  },
                },
              ],
            },
            {
              operationType: 'update',
              $or: [
                {
                  'updateDescription.updatedFields.availabilityAtLocal': {
                    $exists: true,
                    $ne: null,
                  },
                },
                {
                  'updateDescription.updatedFields.availabilityLocation': {
                    $exists: true,
                    $ne: null,
                  },
                },
              ],
            },
          ],
        },
      },
      {
        $project: {
          operationType: 1,
          'documentKey._id': 1,
          'fullDocument.__v': 1,
          'updateDescription.updatedFields.__v': 1,
        },
      },
    ]);
  }

  onApplicationBootstrap(): void {
    this.log.debug('Creating queue');
    const stream = this?.trucksChangeStream;
    if (stream) {
      this.trucksQueue = new Queue<ChangeDocument & TruckChangeDocument>(
        async (): Promise<ChangeDocument & TruckChangeDocument> => {
          await stream.hasNext();
          return stream.next() as unknown as Promise<
            ChangeDocument & TruckChangeDocument
          >;
        },
        this.onNewTruck.bind(this),
        this.configService.get<number>('truckQueue.maxParallelTasks') as number,
        this.configService.get<number>('truckQueue.taskTimeout') as number,
        this.log || console.log,
      );
    }
  }

  async onModuleDestroy(): Promise<void> {
    this.log.debug('Stopping queue');
    await this?.trucksQueue?.stop();
    this.log.debug('Closing change stream');
    await this?.trucksChangeStream?.close();
    this.log.debug('Truck change stream is closed');
  }

  private async onNewTruck(change: ChangeDocument & TruckChangeDocument) {
    this.log.info(`Change ${JSON.stringify(change)}`);
    const version =
      (change.operationType === 'update' &&
        change?.updateDescription?.updatedFields?.__v) ||
      (change.operationType === 'insert' && change?.fullDocument.__v);
    if (!version && version !== 0) {
      this.log.info('No version field in changed data');
      return;
    }
    const truck = await this.truckModel.findOneAndUpdate(
      {
        _id: change.documentKey._id,
        $or: [
          { availabilityAtVer: { $lte: version - 1 } },
          { availabilityAtVer: { $exists: false } },
        ],
      },
      [
        {
          $set: {
            availabilityAtVer: '$__v',
          },
        },
      ],
    );
    if (!truck) {
      this.log.info('Truck not found');
      return;
    }
    this.log.debug(
      `Availability data updated. Calculating "availabilityAt" for Truck ${truck._id}.`,
    );
    const location = truck.availabilityLocation;
    if (!location) {
      this.log.warn(`No will be available location in Truck ${truck._id}`);
    }
    const date = truck.availabilityAtLocal;
    if (!date) {
      this.log.warn('availabilityAtLocal is empty');
      return;
    }
    const timeZoneData = await this.geoApiService.getTimeZone(location, date);
    if (!timeZoneData) {
      this.log.warn('TimeZone is empty');
      return;
    }

    const correctedTimestamp = new Date(
      date.getTime() - (timeZoneData.offset + timeZoneData.dst) * 1000,
    );
    const correctedTimeZoneData = await this.geoApiService.getTimeZone(
      location,
      correctedTimestamp,
    );
    if (!correctedTimeZoneData) {
      this.log.warn('TimeZone is empty');
      return;
    }
    let availabilityCorrection = 0;
    if (timeZoneData.dst && !correctedTimeZoneData.dst) {
      availabilityCorrection = -timeZoneData.dst;
    }
    if (!timeZoneData.dst && correctedTimeZoneData.dst) {
      availabilityCorrection = correctedTimeZoneData.dst;
    }
    let availabilityAt: Date;
    if (availabilityCorrection) {
      availabilityAt = new Date(
        correctedTimestamp.getTime() + availabilityCorrection * 1000,
      );
    } else {
      availabilityAt = correctedTimestamp;
    }

    if (availabilityAt instanceof Date && !isNaN(availabilityAt.getTime())) {
      const updated = await this.truckModel.findOneAndUpdate(
        {
          _id: change.documentKey._id,
          availabilityAtVer: { $lte: truck.__v },
        },
        [
          {
            $set: {
              availabilityAtVer: truck.__v,
              availabilityAt,
            },
          },
        ],
      );
      if (updated) {
        this.log.debug(`Truck ${change.documentKey._id} updated`);
      } else {
        this.log.warn(`Truck ${change.documentKey._id} NOT updated`);
      }
    }
  }
}
