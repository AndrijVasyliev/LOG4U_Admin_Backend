import { PaginateResult } from 'mongoose';
import { Location } from './location.schema';
import { Query, PaginatedResultDto } from '../utils/general.dto';

export class CreateLocationDto {
    readonly zipCode: string;
    readonly name: string;
    readonly stateCode: string;
    readonly stateName: string;
}

export class UpdateLocationDto {
    readonly zipCode?: string;
    readonly name?: string;
    readonly stateCode?: string;
    readonly stateName?: string;
}

export class LocationQuerySearch {
    readonly zipCode?: string;
    readonly name?: string;
    readonly stateCode?: string;
    readonly stateName?: string;
}

export class LocationQuery extends Query<LocationQuerySearch>{
}

export class LocationResultDto extends CreateLocationDto{
    static fromLocationModel(location: Location): LocationResultDto {
        return {
            id: location._id.toString(),
            zipCode: location.zipCode,
            name: location.name,
            stateCode: location.stateCode,
            stateName: location.stateName,
        };
    }

    readonly id: string;
}

export class PaginatedLocationResultDto extends PaginatedResultDto<LocationResultDto> {
    static from(paginatedLocations: PaginateResult<Location>): PaginatedLocationResultDto {
        return {
            items: paginatedLocations.docs.map((location) => (LocationResultDto.fromLocationModel(location))),
            offset: paginatedLocations.offset,
            limit: paginatedLocations.limit,
            total: paginatedLocations.totalDocs,
        };
    }
}
