import { PaginateResult, Types } from 'mongoose';
import {
  Freight,
  Load,
  Stop,
  StopDelivery,
  StopDeliveryDriversInfo,
  StopPickUp,
  StopPickUpDriversInfo,
  StopType,
  TimeFrameAPPT,
  TimeFrameASAP,
  TimeFrameDelivery,
  TimeFrameDirect,
  TimeFrameFCFS,
  TimeFramePickUp,
  TimeFrameType,
} from './load.schema';
import {
  LoadStatus,
  StopDeliveryStatus,
  StopPickupStatus,
  PaginatedResultDto,
  Query,
  TruckType,
  UnitOfLength,
  UnitOfWeight,
} from '../utils/general.dto';
import { calcDistance } from '../utils/haversine.distance';
import { UserResultDto } from '../user/user.dto';
import { TruckResultDto } from '../truck/truck.dto';
import { CustomerResultDto } from '../customer/customer.dto';
import { FacilityResultDto } from '../facility/facility.dto';

interface CreateTimeFrameFCFSDto {
  type: TimeFrameType.FCFS;
  from: Date;
  to: Date;
}

interface CreateTimeFrameAPPTDto {
  type: TimeFrameType.APPT;
  at: Date;
}

interface CreateTimeFrameASAPDto {
  type: TimeFrameType.ASAP;
  at: Date;
}

interface CreateTimeFrameDirectDto {
  type: TimeFrameType.Direct;
  at: Date;
}

interface CreateFreightDto {
  freightId: Types.ObjectId;
  pieces: number;
  unitOfWeight: UnitOfWeight;
  weight: number;
  unitOfLength: UnitOfLength;
  length: number;
}

export interface CreateStopPickUpDriversInfoDto {
  driversInfoId?: Types.ObjectId;
  pieces: number;
  unitOfWeight: UnitOfWeight;
  weight: number;
  bol: string;
  seal: string;
  addressIsCorrect: boolean;
}

export interface CreateStopDeliveryDriversInfoDto {
  driversInfoId?: Types.ObjectId;
  bol: string;
  signedBy: string;
}

interface CreateStopDto {
  stopId?: Types.ObjectId;
  facility: Types.ObjectId;
  addInfo?: string;
}
interface CreateStopPickUpDto extends CreateStopDto {
  type: StopType.PickUp;
  driversInfo?: CreateStopPickUpDriversInfoDto[];
  status?: StopPickupStatus;
  timeFrame:
    | CreateTimeFrameFCFSDto
    | CreateTimeFrameAPPTDto
    | CreateTimeFrameASAPDto;
  freightList: CreateFreightDto[];
}

interface CreateStopDeliveryDto extends CreateStopDto {
  type: StopType.Delivery;
  driversInfo?: CreateStopDeliveryDriversInfoDto[];
  status?: StopDeliveryStatus;
  timeFrame:
    | CreateTimeFrameFCFSDto
    | CreateTimeFrameAPPTDto
    | CreateTimeFrameDirectDto;
  bolList: Types.ObjectId[];
}

export type Stops = (CreateStopPickUpDto | CreateStopDeliveryDto)[];

export interface CreateLoadDto {
  readonly loadNumber: number;
  readonly ref?: string[];
  readonly status: LoadStatus;
  readonly stops: Stops;
  readonly weight: string;
  readonly truckType: TruckType[];
  readonly rate?: number;
  readonly totalCharges: number;
  readonly currency: string;
  readonly bookedByUser: string;
  readonly bookedByCompany?: string;
  readonly assignTo: string[];
  readonly checkInAs?: string;
  readonly truck?: string;
  readonly bookedWith: string;
}

type UpdateStops = ((CreateStopPickUpDto | CreateStopDeliveryDto) & {
  _id: Types.ObjectId;
})[];

export interface StopChangeUpdateDocument {
  readonly operationType: 'update';
  readonly updateDescription: {
    readonly updatedFields: {
      readonly __v?: number;
    };
  };
  readonly fullDocument: {
    readonly stops?: UpdateStops;
    readonly miles?: number[];
    readonly truck?: Types.ObjectId;
    readonly __v?: number;
  };
  readonly fullDocumentBeforeChange: {
    readonly stops?: UpdateStops;
    readonly miles?: number[];
    readonly __v?: number;
  };
}
export interface StopChangeInsertDocument {
  readonly operationType: 'insert';
  readonly fullDocument: {
    readonly stops?: UpdateStops;
    readonly miles?: number[];
    readonly truck?: Types.ObjectId;
    readonly __v?: number;
  };
}

export type StopChangeDocument =
  | StopChangeUpdateDocument
  | StopChangeInsertDocument;

export interface LoadChangeUpdateDocument {
  readonly operationType: 'update';
  readonly updateDescription: {
    readonly updatedFields: {
      readonly __v?: number;
    };
  };
  readonly fullDocument: {
    readonly status?: LoadStatus;
    readonly truck?: Types.ObjectId;
    readonly __v?: number;
  };
  readonly fullDocumentBeforeChange: {
    readonly status?: LoadStatus;
    readonly truck?: Types.ObjectId;
    readonly __v?: number;
  };
}
export interface LoadChangeInsertDocument {
  readonly operationType: 'insert';
  readonly fullDocument: {
    readonly status?: LoadStatus;
    readonly truck?: Types.ObjectId;
    readonly __v?: number;
  };
}

export type LoadChangeDocument =
  | LoadChangeUpdateDocument
  | LoadChangeInsertDocument;

export interface UpdateLoadStopPickUpStatusDto {
  readonly status: StopPickupStatus;
}

export interface UpdateLoadStopDeliveryStatusDto {
  readonly status: StopDeliveryStatus;
}

export interface UpdateLoadDto {
  readonly ref?: string[];
  readonly status?: LoadStatus;
  readonly stops?: Stops;
  readonly weight?: string;
  readonly truckType?: TruckType[];
  readonly rate?: number;
  readonly totalCharges?: number;
  readonly currency: string;
  readonly bookedByUser?: string;
  readonly bookedByCompany?: string;
  readonly assignTo?: string[];
  readonly checkInAs?: string;
  readonly truck?: string;
  readonly bookedWith?: string;
}

export interface LoadQuerySearch {
  readonly search?: string;
  readonly ref?: string;
  readonly loadNumber?: string;
  readonly status?: LoadStatus[];
  readonly weight?: string;
  readonly truckType?: TruckType;
  readonly bookedByCompany?: string;
  readonly checkInAs?: string;
  readonly truckNumber?: number;
  readonly trucksIds?: Types.ObjectId[];
}

export interface LoadQueryOrder
  extends Omit<LoadQuerySearch, 'search' | 'truckType' | 'truckNumber'> {
  readonly rate?: number;
  readonly totalCharges?: number;
  readonly currency?: string;
}

export interface LoadQuery extends Query<LoadQuerySearch, LoadQueryOrder> {}

class TimeFrameFCFSResultDto {
  static fromTimeFrameFCFSModel(
    timeFrame: (TimeFramePickUp | TimeFrameDelivery) & TimeFrameFCFS,
  ): TimeFrameFCFSResultDto {
    return {
      type: timeFrame.type,
      from: timeFrame.from,
      to: timeFrame.to,
    };
  }

  readonly type: TimeFrameType;
  readonly from: Date;
  readonly to: Date;
}
class TimeFrameResultDto {
  static fromTimeFrameModel(
    timeFrame: (TimeFramePickUp | TimeFrameDelivery) &
      (TimeFrameAPPT | TimeFrameASAP | TimeFrameDirect),
  ): TimeFrameResultDto {
    return {
      type: timeFrame.type,
      at: timeFrame.at,
    };
  }

  readonly type: TimeFrameType;
  readonly at: Date;
}

class FreightResultDto {
  static fromFreightModel(freight: Freight): FreightResultDto {
    return {
      freightId: freight.freightId,
      pieces: freight.pieces,
      unitOfWeight: freight.unitOfWeight,
      weight: freight.weight,
      unitOfLength: freight.unitOfLength,
      length: freight.length,
    };
  }

  readonly freightId: Types.ObjectId;
  readonly pieces: number;
  readonly unitOfWeight: UnitOfWeight;
  readonly weight: number;
  readonly unitOfLength: UnitOfLength;
  readonly length: number;
}

class StopPickUpDriversInfoResultDto {
  static fromStopPickUpDriversInfoModel(
    stopPickUpDriversInfo: StopPickUpDriversInfo,
  ): StopPickUpDriversInfoResultDto {
    return {
      driversInfoId: stopPickUpDriversInfo.driversInfoId,
      pieces: stopPickUpDriversInfo.pieces,
      unitOfWeight: stopPickUpDriversInfo.unitOfWeight,
      weight: stopPickUpDriversInfo.weight,
      bol: stopPickUpDriversInfo.bol,
      seal: stopPickUpDriversInfo.seal,
      addressIsCorrect: stopPickUpDriversInfo.addressIsCorrect,
    };
  }

  readonly driversInfoId?: Types.ObjectId;
  readonly pieces: number;
  readonly unitOfWeight: UnitOfWeight;
  readonly weight: number;
  readonly bol: string;
  readonly seal: string;
  readonly addressIsCorrect: boolean;
}

class StopDeliveryDriversInfoResultDto {
  static fromStopDeliveryDriversInfoModel(
    stopDeliveryDriversInfo: StopDeliveryDriversInfo,
  ): StopDeliveryDriversInfoResultDto {
    return {
      driversInfoId: stopDeliveryDriversInfo.driversInfoId,
      bol: stopDeliveryDriversInfo.bol,
      signedBy: stopDeliveryDriversInfo.signedBy,
    };
  }

  readonly driversInfoId: Types.ObjectId;
  readonly bol: string;
  readonly signedBy: string;
}

class StopResultDto {
  static fromStopModel(stop: Stop): StopResultDto {
    const facility =
      stop.facility && FacilityResultDto.fromFacilityModel(stop.facility);
    let result: StopResultDto = {
      stopId: stop.stopId,
      type: stop.type,
      addInfo: stop.addInfo,
    };
    if (facility) {
      result = { ...result, facility };
    }
    return result;
  }

  readonly stopId: Types.ObjectId;
  readonly type: StopType;
  readonly facility?: FacilityResultDto;
  readonly addInfo?: string;
}

class StopPickUpResultDto extends StopResultDto {
  static fromStopPickUpModel(stop: Stop & StopPickUp): StopPickUpResultDto {
    const stopResult = StopResultDto.fromStopModel(stop);
    const driversInfo =
      stop.driversInfo &&
      stop.driversInfo.map((driversInfoItem) =>
        StopPickUpDriversInfoResultDto.fromStopPickUpDriversInfoModel(
          driversInfoItem,
        ),
      );
    const freightList = stop.freightList.map((freight) =>
      FreightResultDto.fromFreightModel(freight),
    );
    const timeFrame = ((timeFrame) => {
      switch (timeFrame.type) {
        case TimeFrameType.APPT:
        case TimeFrameType.ASAP:
          return TimeFrameResultDto.fromTimeFrameModel(timeFrame);
        case TimeFrameType.FCFS:
          return TimeFrameFCFSResultDto.fromTimeFrameFCFSModel(timeFrame);
      }
    })(stop.timeFrame);
    let result: StopPickUpResultDto = {
      ...stopResult,
      status: stop.status,
      freightList,
      timeFrame,
    };
    if (driversInfo) {
      result = { ...result, driversInfo };
    }
    return result;
  }

  readonly status: StopPickupStatus;
  readonly driversInfo?: StopPickUpDriversInfoResultDto[];
  readonly timeFrame: TimeFrameFCFSResultDto | TimeFrameResultDto;
  readonly freightList: FreightResultDto[];
}

class StopDeliveryResultDto extends StopResultDto {
  static fromStopDeliveryModel(
    stop: Stop & StopDelivery,
  ): StopDeliveryResultDto {
    const stopResult = StopResultDto.fromStopModel(stop);
    const driversInfo =
      stop.driversInfo &&
      stop.driversInfo.map((driversInfoItem) =>
        StopDeliveryDriversInfoResultDto.fromStopDeliveryDriversInfoModel(
          driversInfoItem,
        ),
      );
    const timeFrame = ((timeFrame) => {
      switch (timeFrame.type) {
        case TimeFrameType.APPT:
        case TimeFrameType.Direct:
          return TimeFrameResultDto.fromTimeFrameModel(timeFrame);
        case TimeFrameType.FCFS:
          return TimeFrameFCFSResultDto.fromTimeFrameFCFSModel(timeFrame);
      }
    })(stop.timeFrame);
    let result: StopDeliveryResultDto = {
      ...stopResult,
      status: stop.status,
      timeFrame,
      bolList: stop.bolList,
    };
    if (driversInfo) {
      result = { ...result, driversInfo };
    }
    return result;
  }

  readonly status: StopDeliveryStatus;
  readonly driversInfo?: StopDeliveryDriversInfoResultDto[];
  readonly timeFrame: TimeFrameFCFSResultDto | TimeFrameResultDto;
  readonly bolList: string[];
}

export class LoadResultDto {
  static fromLoadModel(load: Load): LoadResultDto {
    const stops = load.stops.map((stop) => {
      switch (stop.type) {
        case StopType.PickUp:
          return StopPickUpResultDto.fromStopPickUpModel(stop);
        case StopType.Delivery:
          return StopDeliveryResultDto.fromStopDeliveryModel(stop);
      }
    });
    const bookedByUser =
      load.bookedByUser && UserResultDto.fromUserModel(load.bookedByUser);
    const assignTo =
      load.assignTo &&
      load.assignTo.length > 0 &&
      load.assignTo.map((dispatcher) =>
        UserResultDto.fromUserModel(dispatcher),
      );
    const truck = load.truck && TruckResultDto.fromTruckModel(load.truck);
    const bookedWith =
      load.bookedWith && CustomerResultDto.fromCustomerModel(load.bookedWith);

    let result: LoadResultDto = {
      id: load._id,
      loadNumber: load.loadNumber,
      ref: load.ref,
      status: load.status,
      stops,
      milesByRoads: load.miles?.reduce((acc, item) => acc + item, 0),
      milesHaversine: stops.reduce(
        (prev, stop, index) => {
          if (index === 0 || prev === undefined) {
            return prev;
          }
          const startCoords = stops[index - 1].facility?.facilityLocation;
          const stopCoords = stop.facility?.facilityLocation;
          if (startCoords && stopCoords) {
            const partRouteLength = calcDistance(startCoords, stopCoords);
            return prev + partRouteLength;
          }
          return;
        },
        0 as number | undefined,
      ),
      weight: load.weight,
      truckType: load.truckType,
      rate: load.rate,
      currency: load.currency,
      totalCharges: load.totalCharges,
      bookedByCompany: load.bookedByCompany,
      checkInAs: load.checkInAs,
    };
    if (bookedByUser) {
      result = { ...result, bookedByUser };
    }
    if (assignTo && assignTo.length > 0) {
      result = { ...result, assignTo };
    }
    if (truck) {
      result = { ...result, truck };
    }
    if (bookedWith) {
      result = { ...result, bookedWith };
    }
    return result;
  }

  readonly id: Types.ObjectId;
  readonly loadNumber: number;
  readonly ref?: string[];
  readonly status: LoadStatus;
  readonly stops: (StopPickUpResultDto | StopDeliveryResultDto)[];
  readonly milesByRoads?: number;
  readonly milesHaversine?: number;
  readonly weight: string;
  readonly truckType: TruckType[];
  readonly rate?: number;
  readonly currency: string;
  readonly totalCharges: number;
  readonly bookedByUser?: UserResultDto;
  readonly bookedByCompany?: string;
  readonly assignTo?: UserResultDto[];
  readonly checkInAs?: string;
  readonly truck?: TruckResultDto;
  readonly bookedWith?: CustomerResultDto;
}

export class PaginatedLoadResultDto extends PaginatedResultDto<LoadResultDto> {
  static from(paginatedLoads: PaginateResult<Load>): PaginatedLoadResultDto {
    return {
      items: paginatedLoads.docs.map((load) =>
        LoadResultDto.fromLoadModel(load),
      ),
      offset: paginatedLoads.offset,
      limit: paginatedLoads.limit,
      total: paginatedLoads.totalDocs,
    };
  }
}
