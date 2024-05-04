import { PaginateResult } from 'mongoose';
import { Facility } from './facility.schema';
import { Query, PaginatedResultDto, GeoPointType } from '../utils/general.dto';

export class CreateFacilityDto {
  readonly name: string;
  readonly address1: string;
  readonly address2?: string;
  readonly facilityLocation: GeoPointType;
}

export class UpdateFacilityDto {
  readonly name?: string;
  readonly address1?: string;
  readonly address2?: string;
  readonly facilityLocation?: GeoPointType;
}

export class FacilityQuerySearch {
  readonly name?: string;
  readonly address1?: string;
  readonly address2?: string;
  readonly facilityLocation?: GeoPointType;
  readonly distance?: number;
}

export class FacilityQuery extends Query<FacilityQuerySearch> {}

export class FacilityResultDto {
  static fromFacilityModel(facility: Facility): FacilityResultDto {
    return {
      id: facility._id.toString(),
      name: facility.name,
      address1: facility.address1,
      address2: facility.address2,
      facilityLocation: facility.facilityLocation,
    };
  }

  readonly id: string;
  readonly name: string;
  readonly address1: string;
  readonly address2?: string;
  readonly facilityLocation: GeoPointType;
}

export class PaginatedFacilityResultDto extends PaginatedResultDto<FacilityResultDto> {
  static from(
    paginatedFacilities: PaginateResult<Facility>,
  ): PaginatedFacilityResultDto {
    return {
      items: paginatedFacilities.docs.map((facility) =>
        FacilityResultDto.fromFacilityModel(facility),
      ),
      offset: paginatedFacilities.offset,
      limit: paginatedFacilities.limit,
      total: paginatedFacilities.totalDocs,
    };
  }
}
