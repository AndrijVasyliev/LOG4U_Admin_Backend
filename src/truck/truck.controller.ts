import {
  Controller,
  Get,
  Param,
  Query,
  Body,
  Post,
  Patch,
  Delete,
  Req,
} from '@nestjs/common';
import { Request } from 'express';
import {
  CreateTruckDto,
  TruckQuery,
  TruckQuerySearch,
  TruckResultDto,
  PaginatedTruckResultDto,
  UpdateTruckDto,
  TruckResultForMapDto,
} from './truck.dto';
import { BodyValidationPipe } from '../utils/bodyValidate.pipe';
import { TruckService } from './truck.service';
import { LoggerService } from '../logger';
import {
  CreateTruckValidation,
  UpdateTruckValidation,
  TruckQueryParamsSchema,
} from './truck.validation';
import { MongoObjectIdPipe } from '../utils/idValidate.pipe';
import { QueryParamsPipe } from '../utils/queryParamsValidate.pipe';
import { Roles } from '../auth/auth.decorator';
import { UserResultDto } from '../user/user.dto';

@Controller('truck')
@Roles('Admin', 'Super Admin')
export class TruckController {
  constructor(
    private readonly log: LoggerService,
    private readonly truckService: TruckService,
  ) {}

  @Get()
  async getTrucks(
    @Query(new QueryParamsPipe<TruckQuerySearch>(TruckQueryParamsSchema))
    truckQuery: TruckQuery,
  ): Promise<PaginatedTruckResultDto> {
    return this.truckService.getTrucks(truckQuery);
  }

  @Get('forMap')
  async getTrucksForMap(): Promise<TruckResultForMapDto[]> {
    return this.truckService.getTrucksForMap();
  }

  @Get(':truckId')
  async getTruck(
    @Param('truckId', MongoObjectIdPipe) truckId: string,
  ): Promise<TruckResultDto> {
    return this.truckService.findTruckById(truckId);
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
    @Req() request: Request,
    @Param('truckId', MongoObjectIdPipe) truckId: string,
    @Body(new BodyValidationPipe(UpdateTruckValidation))
    updateTruckBodyDto: UpdateTruckDto,
  ): Promise<TruckResultDto> {
    const { user } = request as unknown as {
      user: UserResultDto;
    };
    return this.truckService.updateTruck(truckId, updateTruckBodyDto, user);
  }

  @Delete(':truckId')
  async deleteTruck(@Param('truckId', MongoObjectIdPipe) truckId: string) {
    return this.truckService.deleteTruck(truckId);
  }
}
