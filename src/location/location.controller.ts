import {
  Controller,
  Get,
  Param,
  Query,
  Body,
  Post,
  Patch,
  Delete,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import * as readline from 'node:readline';
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
import { LoggerService } from '../logger';
import {
  CreateLocationValidation,
  UpdateLocationValidation,
  LocationQueryParamsSchema,
} from './location.validation';
import { MongoObjectIdPipe } from '../utils/idValidate.pipe';
import { QueryParamsPipe } from '../utils/queryParamsValidate.pipe';
import { Readable } from 'node:stream';
import { Roles } from '../auth/auth.decorator';

@Controller('location')
@Roles('Admin', 'Super Admin')
export class LocationController {
  constructor(
    private readonly log: LoggerService,
    private readonly locationService: LocationService,
  ) {}

  @Get()
  async getLocations(
    @Query(new QueryParamsPipe<LocationQuerySearch>(LocationQueryParamsSchema))
    locationQuery: LocationQuery,
  ): Promise<PaginatedLocationResultDto> {
    return this.locationService.getLocations(locationQuery);
  }

  @Get(':locationId')
  async getLocation(
    @Param('locationId', MongoObjectIdPipe) locationId: string,
  ): Promise<LocationResultDto> {
    return this.locationService.findLocationById(locationId);
  }

  @Post()
  async createLocation(
    @Body(new BodyValidationPipe(CreateLocationValidation))
    createLocationBodyDto: CreateLocationDto,
  ): Promise<LocationResultDto> {
    return this.locationService.createLocation(createLocationBodyDto);
  }

  @Post('fromCsv')
  @UseInterceptors(FileInterceptor('locations'))
  async createLocations(
    @UploadedFile() file: Express.Multer.File,
  ): Promise<LocationResultDto[]> {
    this.log.debug('Creating locations from .csv file');
    // const fileContents = file.buffer.toString();
    const fileStream = Readable.from(file.buffer);

    const fileLines = readline.createInterface({
      input: fileStream,
      crlfDelay: Infinity,
    });
    const result: LocationResultDto[] = [];

    let lineNumber = 0;
    let zipCodePos: number; // Zip Code
    let namePos: number; // Official USPS city name
    let stateCodePos: number; // Official USPS State Code
    let stateNamePos: number; // Official State Name
    let stateLocationPos: number; // Geo Point
    for await (const line of fileLines) {
      if (lineNumber === 0) {
        this.log.debug(`[Headers]: ${line}`);
        const matchArray = line?.match(/(\w.*$)/);
        const clearedString = matchArray ? matchArray[1] : '';
        const stringParts = clearedString.split(';');
        stringParts.forEach((item, index) => {
          switch (item) {
            case 'Zip Code':
              zipCodePos = index;
              break;
            case 'Official USPS city name':
              namePos = index;
              break;
            case 'Official USPS State Code':
              stateCodePos = index;
              break;
            case 'Official State Name':
              stateNamePos = index;
              break;
            case 'Geo Point':
              stateLocationPos = index;
              break;
          }
        });

        if (
          // @ts-ignore
          zipCodePos == undefined ||
          // @ts-ignore
          namePos == undefined ||
          // @ts-ignore
          stateCodePos == undefined ||
          // @ts-ignore
          stateNamePos == undefined ||
          // @ts-ignore
          stateLocationPos == undefined
        ) {
          throw new BadRequestException('Absent required field in file.');
        }
      } else {
        this.log.debug(`[${lineNumber}]: ${line}`);

        const lineParts = line.split(';');

        // @ts-ignore
        const zipCode = lineParts[zipCodePos];
        if (!zipCode)
          throw new BadRequestException(`No Zip Code in ${lineNumber} line`);
        // @ts-ignore
        const name = lineParts[namePos];
        if (!name)
          throw new BadRequestException(`No Name in ${lineNumber} line`);
        // @ts-ignore
        const stateCode = lineParts[stateCodePos];
        if (!stateCode)
          throw new BadRequestException(`No State Code in ${lineNumber} line`);
        // @ts-ignore
        const stateName = lineParts[stateNamePos];
        if (!stateName)
          throw new BadRequestException(`No State Name in ${lineNumber} line`);
        // @ts-ignore
        const locationPart = lineParts[stateLocationPos];
        if (!locationPart)
          throw new BadRequestException(`No Location in ${lineNumber} line`);
        const [latString, longString] = locationPart.split(',');
        const long = Number(longString);
        const lat = Number(latString);
        const location: [number, number] = [lat, long];

        result.push(
          await this.locationService.createLocation({
            zipCode,
            name,
            stateCode,
            stateName,
            location,
          }),
        );
      }
      lineNumber += 1;
    }
    // @ts-ignore
    //this.log.debug(`www ${zipCodePos} ${namePos} ${stateCodePos} ${stateNamePos} ${stateLocationPos}`);
    return result;
  }

  @Patch(':locationId')
  async updateLocation(
    @Param('locationId', MongoObjectIdPipe) locationId: string,
    @Body(new BodyValidationPipe(UpdateLocationValidation))
    updateLocationBodyDto: UpdateLocationDto,
  ): Promise<LocationResultDto> {
    return this.locationService.updateLocation(
      locationId,
      updateLocationBodyDto,
    );
  }

  @Delete(':locationId')
  async deleteLocation(
    @Param('locationId', MongoObjectIdPipe) locationId: string,
  ) {
    return this.locationService.deleteLocation(locationId);
  }
}
