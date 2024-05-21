import { PaginateResult } from 'mongoose';
import { Load } from './load.schema';
import {
  LoadStatus,
  PaginatedResultDto,
  Query,
  TruckType,
} from '../utils/general.dto';
import { GeoLocationDto, LocationResultDto } from '../location/location.dto';
import { calcDistance } from '../utils/haversine.distance';
import { UserResultDto } from '../user/user.dto';
import { TruckResultDto } from '../truck/truck.dto';
import { CustomerResultDto } from '../customer/customer.dto';

export class CreateLoadDto {
  readonly loadNumber: number;
  readonly ref?: string[];
  readonly status: LoadStatus;
  /*readonly pick: GeoLocationDto;
  readonly pickDate: Date;
  readonly deliver: GeoLocationDto;
  readonly deliverDate?: Date;*/
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
  /*readonly pick?: GeoLocationDto;
  readonly pickDate?: Date;
  readonly deliver?: GeoLocationDto;
  readonly deliverDate?: Date;*/
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
      /*pick,
      pickLocation,
      pickDate: load.pickDate,
      deliver,
      deliverLocation,
      deliverDate: load.deliverDate,*/
      milesByRoads: load.miles,
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
  readonly pick?: GeoLocationDto;
  readonly pickLocation?: LocationResultDto;
  readonly pickDate?: Date;
  readonly deliver?: GeoLocationDto;
  readonly deliverLocation?: LocationResultDto;
  readonly deliverDate?: Date;
  readonly milesByRoads?: number;
  readonly milesHaversine?: number;
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
