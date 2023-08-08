import { PaginateResult } from 'mongoose';
import { Load } from './load.schema';
import { PaginatedResultDto, Query, TruckType } from '../utils/general.dto';
import { LocationResultDto } from '../location/location.dto';
import { calcDistance } from '../utils/haversine.distance';
import { UserResultDto } from '../user/user.dto';

export class CreateLoadDto {
  readonly loadNumber: number;
  readonly pick: string;
  readonly pickDate: Date;
  readonly deliver: string;
  readonly deliverDate?: Date;
  readonly weight: string;
  readonly truckType: TruckType[];
  readonly rate?: number;
  readonly bookedByUser?: string;
  readonly bookedByCompany?: string;
  readonly dispatchers?: string[];
  readonly checkInAs?: string;
}

export class UpdateLoadDto {
  readonly pick?: string;
  readonly pickDate?: Date;
  readonly deliver?: string;
  readonly deliverDate?: Date;
  readonly weight?: string;
  readonly truckType?: TruckType[];
  readonly rate?: number;
  readonly bookedByUser?: string;
  readonly bookedByCompany?: string;
  readonly dispatchers?: string[];
  readonly checkInAs?: string;
}

export class LoadQuerySearch {
  readonly loadNumber?: string;
  readonly weight?: string;
  readonly truckType?: TruckType;
  readonly bookedByCompany?: string;
  readonly checkInAs?: string;
}

export class LoadQuery extends Query<LoadQuerySearch> {}

export class LoadResultDto {
  static fromLoadModel(load: Load): LoadResultDto {
    const pick = LocationResultDto.fromLocationModel(load.pick);
    const deliver = LocationResultDto.fromLocationModel(load.deliver);
    const bookedByUser =
      load.bookedByUser && UserResultDto.fromUserModel(load.bookedByUser);
    const dispatchers =
      load.dispatchers &&
      load.dispatchers.map((dispatcher) =>
        UserResultDto.fromUserModel(dispatcher),
      );

    let result: LoadResultDto = {
      id: load._id.toString(),
      loadNumber: load.loadNumber,
      pick,
      pickDate: load.pickDate,
      deliver,
      deliverDate: load.deliverDate,
      milesHaversine: calcDistance(pick.location, deliver.location),
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
    return result;
  }

  readonly id: string;
  readonly loadNumber: number;
  readonly pick: LocationResultDto;
  readonly pickDate: Date;
  readonly deliver: LocationResultDto;
  readonly deliverDate?: Date;
  readonly milesHaversine: number;
  readonly weight: string;
  readonly truckType: TruckType[];
  readonly rate?: number;
  readonly bookedByUser?: UserResultDto;
  readonly bookedByCompany?: string;
  readonly dispatchers?: UserResultDto[];
  readonly checkInAs?: string;
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
