import { PaginateResult } from 'mongoose';
import { Load } from './load.schema';
import { PaginatedResultDto, Query, TruckType } from '../utils/general.dto';
import { GeoLocationDto, LocationResultDto } from '../location/location.dto';
import { calcDistance } from '../utils/haversine.distance';
import { UserResultDto } from '../user/user.dto';
import { TruckResultDto } from '../truck/truck.dto';

export class CreateLoadDto {
  readonly loadNumber: number;
  readonly pick: GeoLocationDto;
  readonly pickDate: Date;
  readonly deliver: GeoLocationDto;
  readonly deliverDate?: Date;
  readonly weight: string;
  readonly truckType: TruckType[];
  readonly rate?: number;
  readonly bookedByUser?: string;
  readonly bookedByCompany?: string;
  readonly dispatchers?: string[];
  readonly checkInAs?: string;
  readonly truck?: string;
}

export class UpdateLoadDto {
  readonly pick?: GeoLocationDto;
  readonly pickDate?: Date;
  readonly deliver?: GeoLocationDto;
  readonly deliverDate?: Date;
  readonly weight?: string;
  readonly truckType?: TruckType[];
  readonly rate?: number;
  readonly bookedByUser?: string;
  readonly bookedByCompany?: string;
  readonly dispatchers?: string[];
  readonly checkInAs?: string;
  readonly truck?: string;
}

export class LoadQuerySearch {
  readonly loadNumber?: string;
  readonly weight?: string;
  readonly truckType?: TruckType;
  readonly bookedByCompany?: string;
  readonly checkInAs?: string;
  readonly truckNumber?: number;
}

export class LoadQuery extends Query<LoadQuerySearch> {}

export class LoadResultDto {
  static fromLoadModel(load: Load): LoadResultDto {
    const pick = load.pick && GeoLocationDto.fromGeoLocationModel(load.pick);
    const pickLocation =
      load.pickLocation &&
      LocationResultDto.fromLocationModel(load.pickLocation);
    const deliver =
      load.deliver && GeoLocationDto.fromGeoLocationModel(load.deliver);
    const deliverLocation =
      load.deliverLocation &&
      LocationResultDto.fromLocationModel(load.deliverLocation);
    const bookedByUser =
      load.bookedByUser && UserResultDto.fromUserModel(load.bookedByUser);
    const dispatchers =
      load.dispatchers &&
      load.dispatchers.length > 0 &&
      load.dispatchers.map((dispatcher) =>
        UserResultDto.fromUserModel(dispatcher),
      );
    const truck = load.truck && TruckResultDto.fromTruckModel(load.truck);

    let result: LoadResultDto = {
      id: load._id.toString(),
      loadNumber: load.loadNumber,
      pick,
      pickLocation,
      pickDate: load.pickDate,
      deliver,
      deliverLocation,
      deliverDate: load.deliverDate,
      milesByRoads: load.miles,
      milesHaversine:
        pick?.geometry?.location &&
        deliver?.geometry?.location &&
        calcDistance(
          [pick?.geometry?.location?.lng, pick?.geometry?.location?.lat],
          [deliver?.geometry?.location?.lng, deliver?.geometry?.location?.lat],
        ),
      weight: load.weight,
      truckType: load.truckType,
      rate: load.rate,
      bookedByCompany: load.bookedByCompany,
      checkInAs: load.checkInAs,
    };
    if (bookedByUser) {
      result = { ...result, bookedByUser };
    }
    if (dispatchers && dispatchers.length > 0) {
      result = { ...result, dispatchers };
    }
    if (truck) {
      result = { ...result, truck };
    }
    return result;
  }

  readonly id: string;
  readonly loadNumber: number;
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
  readonly bookedByUser?: UserResultDto;
  readonly bookedByCompany?: string;
  readonly dispatchers?: UserResultDto[];
  readonly checkInAs?: string;
  readonly truck?: TruckResultDto;
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
