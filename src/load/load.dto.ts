import { PaginateResult } from 'mongoose';
import {
  Freight,
  Load,
  Stop,
  StopDelivery,
  StopPickUp,
  StopType,
  TimeFramesType,
} from './load.schema';
import {
  LoadStatus,
  PaginatedResultDto,
  Query,
  TruckType,
  UnitOfLength,
  UnitOfWeight,
} from '../utils/general.dto';
import { GeoLocationDto, LocationResultDto } from '../location/location.dto';
import { calcDistance } from '../utils/haversine.distance';
import { UserResultDto } from '../user/user.dto';
import { TruckResultDto } from '../truck/truck.dto';
import { CustomerResultDto } from '../customer/customer.dto';
import { FacilityResultDto } from '../facility/facility.dto';

class CreateTimeFrameFCFSDto {
  type = TimeFramesType.FCFS;
  from: Date;
  to: Date;
}

class CreateTimeFrameAPPTDto {
  type = TimeFramesType.APPT;
  at: Date;
}

class CreateTimeFrameASAPDto {
  type = TimeFramesType.ASAP;
  at: Date;
}

class CreateTimeFrameDirectDto {
  type = TimeFramesType.Direct;
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
  readonly totalCharges?: number;
  readonly currency: string;
  readonly bookedByUser?: string;
  readonly bookedByCompany?: string;
  readonly assignTo?: string[];
  readonly checkInAs?: string;
  readonly truck?: string;
  readonly bookedWith?: string;
}

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
      type: stop.type,
      addInfo: stop.addInfo,
    };
    if (facility) {
      result = { ...result, facility };
    }
    return result;
  }

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
    return {
      ...stopResult,
      freightList,
      timeFrame: stop.timeFrame,
    };
  }

  readonly timeFrame: any;
  readonly freightList: FreightResultDto[];
}

class StopDeliveryResultDto extends StopResultDto {
  static fromStopDeliveryModel(
    stop: Stop & StopDelivery,
  ): StopDeliveryResultDto {
    const stopResult = StopResultDto.fromStopModel(stop);
    return {
      ...stopResult,
      timeFrame: stop.timeFrame,
    };
  }

  readonly timeFrame: any;
}

export class LoadResultDto {
  static fromLoadModel(load: Load): LoadResultDto {
    /*const pick = load.pick && GeoLocationDto.fromGeoLocationModel(load.pick);
    const pickLocation =
      load.pickLocation &&
      LocationResultDto.fromLocationModel(load.pickLocation);
    const deliver =
      load.deliver && GeoLocationDto.fromGeoLocationModel(load.deliver);
    const deliverLocation =
      load.deliverLocation &&
      LocationResultDto.fromLocationModel(load.deliverLocation);*/
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
      // milesByRoads: load.miles,
      /*milesHaversine:
        pick?.geometry?.location &&
        deliver?.geometry?.location &&
        calcDistance(
          [pick?.geometry?.location?.lat, pick?.geometry?.location?.lng],
          [deliver?.geometry?.location?.lat, deliver?.geometry?.location?.lng],
        ),*/
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
  // readonly milesByRoads?: number;
  // readonly milesHaversine?: number;
  readonly weight: string;
  readonly truckType: TruckType[];
  readonly rate?: number;
  readonly currency: string;
  readonly totalCharges?: number;
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
