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
  CreateTruckDto,
  TruckQuery,
  TruckQuerySearch,
  TruckResultDto,
  PaginatedTruckResultDto,
  UpdateTruckDto,
} from './truck.dto';
import { BodyValidationPipe } from '../utils/bodyValidate.pipe';
import { TruckService } from './truck.service';
import { LoggerService } from '../logger/logger.service';
import {
  CreateTruckValidation,
  UpdateTruckValidation,
  truckQueryParamsSchema,
} from './truck.validation';
import { MongoObjectIdPipe } from '../utils/idValidate.pipe';
import { QueryParamsPipe } from '../utils/queryParamsValidate.pipe';
import { Roles } from '../auth/auth.decorator';

@Controller('truck')
@Roles('Admin', 'Super Admin')
export class TruckController {
  constructor(
    private readonly log: LoggerService,
    private readonly truckService: TruckService,
  ) {}

  @Get()
  async getTrucks(
    @Query(new QueryParamsPipe<TruckQuerySearch>(truckQueryParamsSchema))
    truckQuery: TruckQuery,
  ): Promise<PaginatedTruckResultDto> {
    return this.truckService.getTrucks(truckQuery);
  }

  @Get(':truckId')
  async getTruck(
    @Param('truckId', MongoObjectIdPipe) truckId: string,
  ): Promise<TruckResultDto> {
    return this.truckService.findTruck(truckId);
  }

  @Post()
  async createTruck(
    @Body(new BodyValidationPipe(CreateTruckValidation))
    createTruckBodyDto: CreateTruckDto,
  ): Promise<TruckResultDto> {
    return this.truckService.createTruck(createTruckBodyDto);
  }

  @Patch(':truckId')
  async updateTruck(
    @Param('truckId', MongoObjectIdPipe) truckId: string,
    @Body(new BodyValidationPipe(UpdateTruckValidation))
    updateTruckBodyDto: UpdateTruckDto,
  ): Promise<TruckResultDto> {
    return this.truckService.updateTruck(truckId, updateTruckBodyDto);
  }

  @Delete(':truckId')
  async deleteTruck(@Param('truckId', MongoObjectIdPipe) truckId: string) {
    return this.truckService.deleteTruck(truckId);
  }
}
