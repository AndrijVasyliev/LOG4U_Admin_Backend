import { mongo, PaginateModel, ObjectId } from 'mongoose';
import {
  Injectable,
  OnApplicationBootstrap,
  OnModuleDestroy,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ConfigService } from '@nestjs/config';
import { Load, LoadDocument, StopType, TimeFrameType } from './load.schema';
import { StopChangeDocument, LoadChangeDocument } from './load.dto';
import { LoggerService } from '../logger';
import {
  MONGO_CONNECTION_NAME,
  STOP_DELIVERY_STATUSES,
  STOP_PICKUP_STATUSES,
} from '../utils/constants';
import { TruckService } from '../truck/truck.service';
import { GoogleGeoApiService } from '../googleGeoApi/googleGeoApi.service';
import { ChangeDocument, Queue } from '../utils/queue';
import { LoadStatus } from '../utils/general.dto';
import { PushService } from '../push/push.service';

const { ChangeStream } = mongo;

@Injectable()
export class LoadWorkerService
  implements OnApplicationBootstrap, OnModuleDestroy
{
  private readonly stopsChangeStream?: InstanceType<typeof ChangeStream>;
  private readonly loadChangeStream?: InstanceType<typeof ChangeStream>;
  private stopsQueue?: Queue<ChangeDocument & StopChangeDocument>;
  private loadQueue?: Queue<ChangeDocument & LoadChangeDocument>;
  constructor(
    @InjectModel(Load.name, MONGO_CONNECTION_NAME)
    private readonly loadModel: PaginateModel<LoadDocument>,
    private readonly truckService: TruckService,
    private readonly geoApiService: GoogleGeoApiService,
    private readonly pushService: PushService,
    private readonly configService: ConfigService,
    private readonly log: LoggerService,
  ) {
    this.stopsChangeStream = loadModel.watch(
      [
        {
          $match: {
            $or: [
              {
                operationType: 'insert',
                'fullDocument.stops': { $exists: true },
              },
              {
                operationType: 'update',
                $expr: {
                  $anyElementTrue: {
                    $map: {
                      input: {
                        $objectToArray: '$updateDescription.updatedFields',
                      },
                      as: 'field',
                      in: {
                        $regexMatch: {
                          input: '$$field.k',
                          regex: new RegExp('^stops(\\.\\d+.*)?$'),
                        },
                      },
                    },
                  },
                },
              },
            ],
          },
        },
        {
          $project: {
            operationType: 1,
            'documentKey._id': 1,
            'fullDocument.__v': 1,
            'fullDocument.stops': 1,
            'fullDocument.miles': 1,
            'fullDocument.truck': 1,
            'fullDocumentBeforeChange.__v': 1,
            'fullDocumentBeforeChange.stops': 1,
            'fullDocumentBeforeChange.miles': 1,
            'updateDescription.updatedFields.__v': 1,
          },
        },
      ],
      {
        fullDocumentBeforeChange: 'whenAvailable',
        fullDocument: 'whenAvailable',
      },
    );
    this.loadChangeStream = loadModel.watch(
      [
        {
          $match: {
            $or: [
              {
                operationType: 'insert',
                'fullDocument.truck': { $exists: true },
              },
              {
                operationType: 'update',
                $or: [
                  {
                    'updateDescription.updatedFields.status': { $exists: true },
                  },
                  {
                    'updateDescription.updatedFields.truck': { $exists: true },
                  },
                  { 'updateDescription.removedFields': 'truck' },
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
            'fullDocument.truck': 1,
            'fullDocument.status': 1,
            'fullDocumentBeforeChange.__v': 1,
            'fullDocumentBeforeChange.truck': 1,
            'fullDocumentBeforeChange.status': 1,
            'updateDescription.updatedFields.__v': 1,
          },
        },
      ],
      {
        fullDocumentBeforeChange: 'whenAvailable',
        fullDocument: 'whenAvailable',
      },
    );
  }

  onApplicationBootstrap(): void {
    this.log.debug('Creating queue');
    const stopsStream = this?.stopsChangeStream;
    if (stopsStream) {
      this.stopsQueue = new Queue<ChangeDocument & StopChangeDocument>(
        async (): Promise<ChangeDocument & StopChangeDocument> => {
          await stopsStream.hasNext();
          return stopsStream.next() as unknown as Promise<
            ChangeDocument & StopChangeDocument
          >;
        },
        this.onNewStop.bind(this),
        this.configService.get<number>('loadQueue.maxParallelTasks') as number,
        this.configService.get<number>('loadQueue.taskTimeout') as number,
        this.log || console.log,
      );
    }
    const loadStream = this?.loadChangeStream;
    if (loadStream) {
      this.loadQueue = new Queue<ChangeDocument & LoadChangeDocument>(
        async (): Promise<ChangeDocument & LoadChangeDocument> => {
          await loadStream.hasNext();
          return loadStream.next() as unknown as Promise<
            ChangeDocument & LoadChangeDocument
          >;
        },
        this.onNewLoad.bind(this),
        this.configService.get<number>('loadQueue.maxParallelTasks') as number,
        this.configService.get<number>('loadQueue.taskTimeout') as number,
        this.log || console.log,
      );
    }
  }
  async onModuleDestroy(): Promise<void> {
    this.log.debug('Stopping queue');
    await this?.stopsQueue?.stop();
    await this?.loadQueue?.stop();
    this.log.debug('Closing change stream');
    await this?.stopsChangeStream?.close();
    this.log.debug('Load change stream is closed');
  }

  private async onNewStop(change: ChangeDocument & StopChangeDocument) {
    this.log.info(`Change ${JSON.stringify(change)}`);
    const version =
      (change.operationType === 'update' &&
        change?.updateDescription?.updatedFields?.__v) ||
      (change.operationType === 'insert' && change?.fullDocument.__v);
    if (!version && version !== 0) {
      this.log.info('No version field in changed data');
      return;
    }
    const load = await this.loadModel
      .findOneAndUpdate(
        {
          _id: change.documentKey._id,
          $or: [
            { stopsVer: { $lte: version - 1 } },
            { stopsVer: { $exists: false } },
          ],
        },
        [
          {
            $set: {
              stopsVer: '$__v', // Probably { $subtract: ['$__v', 0.5] },
            },
          },
          {
            $unset: ['miles'], // ToDo probably null this on update stops field
          },
        ],
      )
      .populate('stops');
    if (!load) {
      this.log.info('Load not found');
      return;
    }

    const filter: Record<string, any> = {
      _id: change.documentKey._id,
      stopsVer: { $lte: load.__v },
    };
    const setData: Record<string, any> = {
      stopsVer: load.__v,
    };

    const stopsBeforeChange =
      change.operationType === 'update'
        ? change.fullDocumentBeforeChange.stops
        : undefined;
    const milesBeforeChange =
      change.operationType === 'update'
        ? change.fullDocumentBeforeChange.miles
        : undefined;
    const stopsAfterChange = change.fullDocument.stops;
    const stops = load.stops;
    const firstStop = stops?.at(0);
    const lastStop = stops?.at(-1);

    // Calculate start and stop date
    const stopsStart =
      firstStop &&
      (firstStop.timeFrame.type === TimeFrameType.FCFS
        ? firstStop.timeFrame.from
        : firstStop.timeFrame.at);
    const stopsEnd =
      lastStop &&
      (lastStop.timeFrame.type === TimeFrameType.FCFS
        ? lastStop.timeFrame.to
        : lastStop.timeFrame.at);
    this.log.debug(
      `Setting stopsStart to ${stopsStart} and stopsEnd to ${stopsEnd}`,
    );
    Object.assign(setData, { stopsStart, stopsEnd });

    // Calculate stop status
    const stopInNonFinalStatusIndex = stops.findIndex(
      (stop) =>
        (stop.type === StopType.PickUp &&
          stop.status !== STOP_PICKUP_STATUSES.at(0) &&
          stop.status !== STOP_PICKUP_STATUSES.at(-1)) ||
        (stop.type === StopType.Delivery &&
          stop.status !== STOP_DELIVERY_STATUSES.at(0) &&
          stop.status !== STOP_DELIVERY_STATUSES.at(-1)),
    );
    const firstStopInNewStatusIndex = stops.findIndex(
      (stop) =>
        (stop.type === StopType.PickUp &&
          stop.status === STOP_PICKUP_STATUSES.at(0)) ||
        (stop.type === StopType.Delivery &&
          stop.status === STOP_DELIVERY_STATUSES.at(0)),
    );

    if (
      !~stopInNonFinalStatusIndex &&
      ~firstStopInNewStatusIndex &&
      firstStopInNewStatusIndex !== 0
    ) {
      const stopToNextStatus = stops[firstStopInNewStatusIndex];
      let nextStopStatus: string | undefined;
      switch (stopToNextStatus.type) {
        case StopType.PickUp:
          nextStopStatus = STOP_PICKUP_STATUSES.at(1);
          break;
        case StopType.Delivery:
          nextStopStatus = STOP_DELIVERY_STATUSES.at(1);
          break;
      }
      if (nextStopStatus) {
        this.log.debug(
          `Setting stop at index [${firstStopInNewStatusIndex}] to ${nextStopStatus} status`,
        );
        Object.assign(filter, {
          'stops._id': stops[firstStopInNewStatusIndex]._id,
        });
        Object.assign(setData, { 'stops.$.status': nextStopStatus });
      }
    } else if (
      load.status !== 'Completed' &&
      !~firstStopInNewStatusIndex &&
      !~stopInNonFinalStatusIndex &&
      (change.operationType === 'insert' ||
        (stopsBeforeChange?.at(-1)?.type === StopType.Delivery &&
          stopsBeforeChange?.at(-1)?.status !== STOP_DELIVERY_STATUSES.at(-1)))
    ) {
      this.log.debug('Setting load status to completed');
      Object.assign(setData, { status: 'Completed' });
    }

    // Calculate stop distances
    this.log.debug(
      `Stops updated. Calculating distance for Load ${load._id.toString()}.`,
    );
    let miles: number[] | void = [];
    this.log.debug('Calculating distance by roads');
    for (let stopIndex = 0; stopIndex < stops.length - 1; stopIndex++) {
      const stop = stops[stopIndex];
      const nextStop = stops[stopIndex + 1];
      let partRouteLength: number | void = undefined;

      if (stopsBeforeChange) {
        for (let i = 0; i < stopsBeforeChange.length - 1; i++) {
          const stopBeforeChange = stopsBeforeChange[i];
          if (
            stopBeforeChange._id &&
            stopBeforeChange._id.toString() === stop.stopId?.toString()
          ) {
            const nextStopBeforeChange = stopsBeforeChange[i + 1];
            if (
              stopBeforeChange.facility.toString() ===
                stop.facility.id.toString() &&
              nextStopBeforeChange._id &&
              nextStopBeforeChange._id.toString() ===
                nextStop.stopId.toString() &&
              nextStopBeforeChange.facility.toString() ===
                nextStop.facility.id.toString()
            ) {
              partRouteLength = milesBeforeChange && milesBeforeChange[i];
            }
            break;
          }
        }
      }

      if (partRouteLength === undefined) {
        partRouteLength = await this.geoApiService.getDistance(
          stop.facility.facilityLocation,
          nextStop.facility.facilityLocation,
        );
      }

      if (partRouteLength === undefined) {
        miles = undefined;
        break;
      }
      miles.push(Number(partRouteLength));
    }
    Object.assign(setData, { miles });
    this.log.debug(`Calculated distance: ${miles}`);

    const updated = await this.loadModel.findOneAndUpdate(
      filter,
      {
        $set: setData,
      },
      { strict: false },
    );
    if (updated) {
      this.log.debug(`Load ${change.documentKey._id} updated`);
    } else {
      this.log.warn(`Load ${change.documentKey._id} NOT updated`);
    }

    const stopBeforeChangeInNonFinalStatusIndex =
      stopsBeforeChange === undefined
        ? -1
        : stopsBeforeChange.findIndex(
            (stop) =>
              (stop.type === StopType.PickUp &&
                stop.status !== STOP_PICKUP_STATUSES.at(0) &&
                stop.status !== STOP_PICKUP_STATUSES.at(-1)) ||
              (stop.type === StopType.Delivery &&
                stop.status !== STOP_DELIVERY_STATUSES.at(0) &&
                stop.status !== STOP_DELIVERY_STATUSES.at(-1)),
          );
    const stopAfterChangeInNonFinalStatusIndex =
      stopsAfterChange === undefined
        ? -1
        : stopsAfterChange?.findIndex(
            (stop) =>
              (stop.type === StopType.PickUp &&
                stop.status !== STOP_PICKUP_STATUSES.at(0) &&
                stop.status !== STOP_PICKUP_STATUSES.at(-1)) ||
              (stop.type === StopType.Delivery &&
                stop.status !== STOP_DELIVERY_STATUSES.at(0) &&
                stop.status !== STOP_DELIVERY_STATUSES.at(-1)),
          );
    if (
      stopsAfterChange &&
      ~stopAfterChangeInNonFinalStatusIndex &&
      stopsAfterChange[stopAfterChangeInNonFinalStatusIndex]?.status ===
        'GTG' &&
      (!(stopsBeforeChange && ~stopBeforeChangeInNonFinalStatusIndex) ||
        stopsBeforeChange[
          stopBeforeChangeInNonFinalStatusIndex
        ]._id.toString() !==
          stopsAfterChange[
            stopAfterChangeInNonFinalStatusIndex
          ]._id.toString() ||
        stopsBeforeChange[stopBeforeChangeInNonFinalStatusIndex].status !==
          stopsAfterChange[stopAfterChangeInNonFinalStatusIndex].status) &&
      change.fullDocument.truck
    ) {
      this.log.debug(
        `Load ${change.documentKey._id} in progress is now on truck ${change.fullDocument.truck}`,
      );

      const truck = await this.truckService.findTruckById(
        change.fullDocument.truck,
      );
      if (truck && truck.driver) {
        const newPushMessage = await this.pushService.createPush({
          to: truck.driver.id,
          title: 'You are Good To Go.',
          body: `Stop #${stopAfterChangeInNonFinalStatusIndex + 1} in Load #${load.loadNumber} is verified by dispatcher and you are good to go.`,
          data: {
            routeTo: `/home/loads?selectedLoadId=${change.documentKey._id}&renew=data`,
          },
        });
        await this.pushService.updatePush(newPushMessage.id, {
          state: 'Ready for send',
        });
      } else {
        this.log.warn(
          `Truck ${change.fullDocument.truck} not found or have no driver assigned`,
        );
      }
    }
  }

  private async onNewLoad(change: ChangeDocument & LoadChangeDocument) {
    this.log.info(`Change ${JSON.stringify(change)}`);
    const version =
      (change.operationType === 'update' &&
        change?.updateDescription?.updatedFields?.__v) ||
      (change.operationType === 'insert' && change?.fullDocument.__v);
    if (!version && version !== 0) {
      this.log.info('No version field in changed data');
      return;
    }
    const load = await this.loadModel.findOneAndUpdate(
      {
        _id: change.documentKey._id,
        $or: [
          { statusVer: { $lte: version - 1 } },
          { statusVer: { $exists: false } },
        ],
      },
      [
        {
          $set: {
            statusVer: '$__v',
          },
        },
      ],
    );
    if (!load) {
      this.log.info('Load not found');
      return;
    }

    let oldTruckActivatedLoadId: ObjectId | null = null;
    let newTruckActivatedLoadId: ObjectId | null = null;
    let currentTruckLoadUpdateInvoked = false;

    const truckIdsToOnRoute = new Set<string>();
    const truckIdsToAvailable = new Set<string>();

    if (
      change.operationType === 'update' &&
      change.fullDocument.status !== change.fullDocumentBeforeChange.status &&
      change.fullDocument.truck?.toString() ===
        change.fullDocumentBeforeChange.truck?.toString() &&
      change.fullDocument.truck &&
      change.fullDocumentBeforeChange.status === 'In Progress'
    ) {
      currentTruckLoadUpdateInvoked = true;
      const loadToInProgress = await this.loadModel
        .findOne({
          status: 'Planned',
          truck: change.fullDocument.truck,
        })
        .sort({ stopsStart: 1 });
      if (loadToInProgress) {
        this.log.debug(
          `Changing load status from ${loadToInProgress.status} to In Progress for ${loadToInProgress._id}`,
        );
        loadToInProgress.set('status', 'In Progress');
        await loadToInProgress.save();
        newTruckActivatedLoadId = loadToInProgress._id;
        this.log.debug(`Load ${loadToInProgress._id} saved`);
      } else {
        truckIdsToAvailable.add(change.fullDocument.truck.toString());
      }
    }

    if (
      change.operationType === 'update' &&
      change.fullDocument.truck?.toString() !==
        change.fullDocumentBeforeChange.truck?.toString() &&
      change.fullDocumentBeforeChange.truck &&
      change.fullDocumentBeforeChange.status === 'In Progress'
    ) {
      const loadToInProgress = await this.loadModel
        .findOne({
          status: 'Planned',
          truck: change.fullDocumentBeforeChange.truck,
        })
        .sort({ stopsStart: 1 });
      if (loadToInProgress) {
        this.log.debug(
          `Changing load status from ${loadToInProgress.status} to In Progress for ${loadToInProgress._id}`,
        );
        loadToInProgress.set('status', 'In Progress');
        await loadToInProgress.save();
        oldTruckActivatedLoadId = loadToInProgress._id;
        this.log.debug(`Load ${loadToInProgress._id} saved`);
      } else {
        truckIdsToAvailable.add(
          change.fullDocumentBeforeChange.truck.toString(),
        );
      }
    }

    if (
      ((change.operationType === 'update' &&
        (change.fullDocument.truck?.toString() !==
          change.fullDocumentBeforeChange.truck?.toString() ||
          change.fullDocument.status !==
            change.fullDocumentBeforeChange.status) &&
        newTruckActivatedLoadId?.toString() !==
          change.documentKey._id?.toString()) ||
        (change.operationType === 'insert' && change.fullDocument.truck)) &&
      change.fullDocument.status !== 'TONU' &&
      change.fullDocument.status !== 'Cancelled' &&
      change.fullDocument.status !== 'Completed'
    ) {
      this.log.debug(
        `Will recalculate status for load ${change.documentKey._id}`,
      );
      let newLoadStatus: LoadStatus;
      if (!change.fullDocument.truck) {
        newLoadStatus = 'Available';
      } else if (
        currentTruckLoadUpdateInvoked &&
        newTruckActivatedLoadId?.toString() !==
          change.documentKey._id?.toString()
      ) {
        newLoadStatus = 'Planned';
      } else {
        const loadInProgress = await this.loadModel.findOne({
          _id: { $ne: change.documentKey._id },
          status: 'In Progress',
          truck: change.fullDocument.truck,
        });
        newLoadStatus = loadInProgress ? 'Planned' : 'In Progress';
      }
      if (load.status !== newLoadStatus) {
        this.log.debug(
          `Changing load status from ${load.status} to ${newLoadStatus}`,
        );
        if (change.fullDocument.truck && newLoadStatus === 'In Progress') {
          newTruckActivatedLoadId = change.documentKey._id;
          truckIdsToOnRoute.add(change.fullDocument.truck.toString());
          truckIdsToAvailable.delete(change.fullDocument.truck.toString());
        }

        const updated = await this.loadModel.findOneAndUpdate(
          {
            _id: change.documentKey._id,
            statusVer: { $lte: load.__v },
          },
          [
            {
              $set: {
                statusVer: load.__v,
                status: newLoadStatus,
              },
            },
          ],
        );
        if (updated) {
          this.log.debug(`Load ${change.documentKey._id} updated`);
        } else {
          this.log.warn(`Load ${change.documentKey._id} NOT updated`);
        }
      }
    }

    if (
      ((change.operationType === 'update' &&
        (change.fullDocument.truck?.toString() !==
          change.fullDocumentBeforeChange.truck?.toString() ||
          change.fullDocument.status !==
            change.fullDocumentBeforeChange.status)) ||
        change.operationType === 'insert') &&
      change.fullDocument.status === 'In Progress' &&
      change.fullDocument.truck
    ) {
      truckIdsToOnRoute.add(change.fullDocument.truck.toString());
    }

    if (truckIdsToAvailable.size > 0) {
      for (const truckId of truckIdsToAvailable) {
        this.log.debug(`Setting Available state to truck ${truckId}`);
        await this.truckService.updateTruck(truckId, {
          status: 'Available',
        });
        this.log.debug(`Truck ${truckId} updated`);
      }
    }
    if (truckIdsToOnRoute.size > 0) {
      for (const truckId of truckIdsToOnRoute) {
        this.log.debug(`Setting On route state to truck ${truckId}`);
        await this.truckService.updateTruck(truckId, {
          status: 'On route',
        });
        this.log.debug(`Truck ${truckId} updated`);
      }
    }

    if (
      ((change.operationType === 'update' &&
        (change.fullDocument.truck?.toString() !==
          change.fullDocumentBeforeChange.truck?.toString() ||
          change.fullDocument.status !==
            change.fullDocumentBeforeChange.status)) ||
        change.operationType === 'insert') &&
      change.fullDocument.truck &&
      (change.fullDocument.status === 'In Progress' ||
        newTruckActivatedLoadId?.toString() ===
          change.documentKey._id?.toString())
    ) {
      this.log.debug(
        `Load ${change.documentKey._id} in progress is now on truck ${change.fullDocument.truck}`,
      );

      const truck = await this.truckService.findTruckById(
        change.fullDocument.truck,
      );
      if (truck && truck.driver) {
        const newPushMessage = await this.pushService.createPush({
          to: truck.driver.id,
          title: 'New load is assigned.',
          body: `Load #${load.loadNumber} is assigned to truck #${truck.truckNumber} and transferred to "In Progress".`,
          data: {
            routeTo: `/home/loads?selectedLoadId=${change.documentKey._id}&renew=data`,
          },
        });
        await this.pushService.updatePush(newPushMessage.id, {
          state: 'Ready for send',
        });
      } else {
        this.log.warn(
          `Truck ${change.fullDocument.truck} not found or have no driver assigned`,
        );
      }
    }
  }
}
