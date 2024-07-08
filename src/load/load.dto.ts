import { PaginateResult } from 'mongoose';
import {
  Freight,
  Load,
  Stop,
  StopDelivery,
  StopPickUp,
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

class CreateTimeFrameFCFSDto {
  type = TimeFrameType.FCFS;
  from: Date;
  to: Date;
}

class CreateTimeFrameAPPTDto {
  type = TimeFrameType.APPT;
  at: Date;
}

class CreateTimeFrameASAPDto {
  type = TimeFrameType.ASAP;
  at: Date;
}

class CreateTimeFrameDirectDto {
  type = TimeFrameType.Direct;
  at: Date;
}

class CreateFreightDto {
  pieces: number;
  unitOfWeight: UnitOfWeight;
  weight: number;
  unitOfLength: UnitOfLength;
  length: number;
}

class CreateStopDto {
  stopId?: string;
  facility: string;
  addInfo?: string;
}
class CreateStopPickUpDto extends CreateStopDto {
  type = StopType.PickUp;
  timeFrame:
    | CreateTimeFrameFCFSDto
    | CreateTimeFrameAPPTDto
    | CreateTimeFrameASAPDto;
  freightList: CreateFreightDto[];
}

class CreateStopDeliveryDto extends CreateStopDto {
  type = StopType.Delivery;
  timeFrame:
    | CreateTimeFrameFCFSDto
    | CreateTimeFrameAPPTDto
    | CreateTimeFrameDirectDto;
}

export class CreateLoadDto {
  readonly loadNumber: number;
  readonly ref?: string[];
  readonly status: LoadStatus;
  readonly stops: (CreateStopPickUpDto | CreateStopDeliveryDto)[];
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

export class LoadChangeUpdateDocument {
  readonly operationType: 'update';
  readonly updateDescription: {
    readonly updatedFields: {
      readonly stops?: (CreateStopPickUpDto | CreateStopDeliveryDto)[];
      readonly __v?: number;
    };
  };
}
export class LoadChangeInsertDocument {
  readonly operationType: 'insert';
  readonly fullDocument: {
    readonly stops?: (CreateStopPickUpDto | CreateStopDeliveryDto)[];
    readonly __v?: number;
  };
}

export type LoadChangeDocument =
  | LoadChangeUpdateDocument
  | LoadChangeInsertDocument;

export class UpdateLoadDto {
  readonly ref?: string[];
  readonly status?: LoadStatus;
  readonly stops?: (CreateStopPickUpDto | CreateStopDeliveryDto)[];
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

export class LoadQuerySearch {
  readonly loadNumber?: string;
  readonly status?: LoadStatus;
  readonly weight?: string;
  readonly truckType?: TruckType;
  readonly bookedByCompany?: string;
  readonly checkInAs?: string;
  readonly truckNumber?: number;
}

export class LoadQuery extends Query<LoadQuerySearch> {}

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
  static fromStopModel(freight: Freight): FreightResultDto {
    return {
      pieces: freight.pieces,
      unitOfWeight: freight.unitOfWeight,
      weight: freight.weight,
      unitOfLength: freight.unitOfLength,
      length: freight.length,
    };
  }

  readonly pieces: number;
  readonly unitOfWeight: UnitOfWeight;
  readonly weight: number;
  readonly unitOfLength: UnitOfLength;
  readonly length: number;
}

class StopResultDto {
  static fromStopModel(stop: Stop): StopResultDto {
    const facility =
      stop.facility && FacilityResultDto.fromFacilityModel(stop.facility);
    let result: StopResultDto = {
      stopId: stop.stopId.toString(),
      type: stop.type,
      addInfo: stop.addInfo,
    };
    if (facility) {
      result = { ...result, facility };
    }
    return result;
  }

  readonly stopId: string;
  readonly type: StopType;
  readonly facility?: FacilityResultDto;
  readonly addInfo?: string;
}

class StopPickUpResultDto extends StopResultDto {
  static fromStopPickUpModel(stop: Stop & StopPickUp): StopPickUpResultDto {
    const stopResult = StopResultDto.fromStopModel(stop);
    const freightList = stop.freightList.map((freight) =>
      FreightResultDto.fromStopModel(freight),
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
    return {
      ...stopResult,
      freightList,
      timeFrame,
    };
  }

  readonly timeFrame: TimeFrameFCFSResultDto | TimeFrameResultDto;
  readonly freightList: FreightResultDto[];
}

class StopDeliveryResultDto extends StopResultDto {
  static fromStopDeliveryModel(
    stop: Stop & StopDelivery,
  ): StopDeliveryResultDto {
    const stopResult = StopResultDto.fromStopModel(stop);
    const timeFrame = ((timeFrame) => {
      switch (timeFrame.type) {
        case TimeFrameType.APPT:
        case TimeFrameType.Direct:
          return TimeFrameResultDto.fromTimeFrameModel(timeFrame);
        case TimeFrameType.FCFS:
          return TimeFrameFCFSResultDto.fromTimeFrameFCFSModel(timeFrame);
      }
    })(stop.timeFrame);
    return {
      ...stopResult,
      timeFrame,
    };
  }

  readonly timeFrame: TimeFrameFCFSResultDto | TimeFrameResultDto;
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
      id: load._id.toString(),
      loadNumber: load.loadNumber,
      ref: load.ref,
      status: load.status,
      stops,
      milesByRoads: load.miles,
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

  readonly id: string;
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
