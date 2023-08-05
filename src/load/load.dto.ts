import { PaginateResult } from 'mongoose';
import { Load } from './load.schema';
import { PaginatedResultDto, Query, TruckType } from '../utils/general.dto';

export class CreateLoadDto {
  readonly pick: string;
  readonly pickDate: Date;
  readonly deliver: string;
  readonly deliverDate?: Date;
  readonly weight: string;
  readonly truckType: TruckType[];
  readonly rate?: number;
  // readonly bookedByUser?: User;
  readonly bookedByCompany?: string;
  // readonly dispatchers?: User[];
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
  // readonly bookedByUser?: User;
  readonly bookedByCompany?: string;
  // readonly dispatchers?: User[];
  readonly checkInAs?: string;
}

export class LoadQuerySearch {
  readonly pick?: string;
  readonly deliver?: string;
  readonly weight?: string;
  readonly truckType?: TruckType;
  // readonly bookedByUser?: User;
  readonly bookedByCompany?: string;
  // readonly dispatchers?: User[];
  readonly checkInAs?: string;
}

export class LoadQuery extends Query<LoadQuerySearch> {}

export class LoadResultDto extends CreateLoadDto {
  static fromLoadModel(load: Load): LoadResultDto {
    return {
      id: load._id.toString(),
      pick: load.pick,
      pickDate: load.pickDate,
      deliver: load.deliver,
      deliverDate: load.deliverDate,
      weight: load.weight,
      truckType: load.truckType,
      rate: load.rate,
      // bookedByUser: load.bookedByUser,
      bookedByCompany: load.bookedByCompany,
      // dispatchers: load.dispatchers,
      checkInAs: load.checkInAs,
    };
  }

  readonly id: string;
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
