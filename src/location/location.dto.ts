import { PaginateResult } from 'mongoose';
import { GeoLocation, GeometryLocation, Location } from './location.schema';
import { Query, PaginatedResultDto } from '../utils/general.dto';

export class AddressLocation {
  short_name: string;
  long_name: string;
  postcode_localities?: string[];
  types: string[];
}

export class GeoCode {
  compound_code: string;
  global_code: string;
}

export class LatLng {
  lat: number;
  lng: number;
}

export class GeometryLocationDto {
  static fromGeometryLocationModel(
    geometryLocation: GeometryLocation,
  ): GeometryLocationDto {
    return {
      location: geometryLocation.location,
      location_type: geometryLocation.location_type,
      viewport: geometryLocation.viewport,
      bounds: geometryLocation.bounds,
    };
  }

  location: LatLng;
  location_type?: string;
  viewport?: object;
  bounds?: object;
}

export class GeoLocationDto {
  static fromGeoLocationModel(geoLocation: GeoLocation): GeoLocation {
    const geometry =
      geoLocation.geometry &&
      GeometryLocationDto.fromGeometryLocationModel(geoLocation.geometry);
    return {
      types: geoLocation.types,
      formatted_address: geoLocation.formatted_address,
      address_components: geoLocation.address_components,
      partial_match: geoLocation.partial_match,
      place_id: geoLocation.place_id,
      plus_code: geoLocation.plus_code,
      postcode_localities: geoLocation.postcode_localities,
      geometry,
    };
  }

  types?: string[];
  formatted_address: string;
  address_components?: AddressLocation[];
  partial_match?: boolean;
  place_id?: string;
  plus_code?: GeoCode;
  postcode_localities?: string[];
  geometry: GeometryLocationDto;
}

export class CreateLocationDto {
  readonly zipCode: string;
  readonly name: string;
  readonly stateCode: string;
  readonly stateName: string;
  readonly location: [number, number];
}

export class UpdateLocationDto {
  readonly zipCode?: string;
  readonly name?: string;
  readonly stateCode?: string;
  readonly stateName?: string;
  readonly location?: [number, number];
}

export class LocationQuerySearch {
  readonly search?: string;
  readonly searchState?: string;
  readonly zipCode?: string;
  readonly name?: string;
  readonly stateCode?: string;
  readonly stateName?: string;
  readonly location?: [number, number];
  readonly distance?: number;
}

export class LocationQuery extends Query<LocationQuerySearch> {}

export class LocationResultDto extends CreateLocationDto {
  static fromLocationModel(location: Location): LocationResultDto {
    return {
      id: location._id.toString(),
      zipCode: location.zipCode,
      name: location.name,
      stateCode: location.stateCode,
      stateName: location.stateName,
      location: location.location,
    };
  }

  readonly id: string;
}

export class PaginatedLocationResultDto extends PaginatedResultDto<LocationResultDto> {
  static from(
    paginatedLocations: PaginateResult<Location>,
  ): PaginatedLocationResultDto {
    return {
      items: paginatedLocations.docs.map((location) =>
        LocationResultDto.fromLocationModel(location),
      ),
      offset: paginatedLocations.offset,
      limit: paginatedLocations.limit,
      total: paginatedLocations.totalDocs,
    };
  }
}
