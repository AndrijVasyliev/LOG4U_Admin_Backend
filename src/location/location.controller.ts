import {
    Controller,
    Get,
    Param,
    Query,
    Body,
    Post,
    Patch,
    Delete,
} from '@nestjs/common';
import {
    CreateLocationDto,
    LocationQuery,
    LocationQuerySearch,
    LocationResultDto,
    PaginatedLocationResultDto,
    UpdateLocationDto,
} from './location.dto';
import { BodyValidationPipe } from '../utils/bodyValidate.pipe';
import { LocationService } from './location.service';
import { LoggerService } from '../logger/logger.service';
import { CreateLocationValidation, UpdateLocationValidation, locationQueryParamsSchema } from './location.validation';
import { MongoObjectIdPipe } from '../utils/idValidate.pipe';
import { QueryParamsPipe } from '../utils/queryParamsValidate.pipe';

@Controller('location')
export class LocationController {
    constructor(
        private readonly log: LoggerService,
        private readonly locationService: LocationService,
    ) {}

    @Get()
    async getLocations(
        @Query(new QueryParamsPipe<LocationQuerySearch>(locationQueryParamsSchema)) locationQuery: LocationQuery,
    ): Promise<PaginatedLocationResultDto> {
        return this.locationService.getLocations(locationQuery);
    }

    @Get(':locationId')
    async getLocation(
        @Param('locationId', MongoObjectIdPipe) locationId: string,
    ): Promise<LocationResultDto> {
        return this.locationService.findLocation(locationId);
    }

    @Post()
    async createLocation(
        @Body(new BodyValidationPipe(CreateLocationValidation)) createLocationBodyDto: CreateLocationDto,
    ): Promise<LocationResultDto> {
        return this.locationService.createLocation(createLocationBodyDto);
    }

    @Patch(':locationId')
    async updateLocation(
        @Param('locationId', MongoObjectIdPipe) locationId: string,
        @Body(new BodyValidationPipe(UpdateLocationValidation)) updateLocationBodyDto: UpdateLocationDto,
    ): Promise<LocationResultDto> {
        return this.locationService.updateLocation(locationId, updateLocationBodyDto);
    }

    @Delete(':locationId')
    async deleteLocation( @Param('locationId', MongoObjectIdPipe) locationId: string,) {
        return this.locationService.deleteLocation(locationId);
    }
}
