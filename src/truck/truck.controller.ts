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
import { Types } from 'mongoose';
import {
  CreateTruckDto,
  TruckQuery,
  TruckResultDto,
  PaginatedTruckResultDto,
  UpdateTruckDto,
  TruckResultForMapDto,
} from './truck.dto';
import { TruckService } from './truck.service';
import { SetUpdatedByToAdmin } from './truck.transformation';
import { LoggerService } from '../logger';
import {
  CreateTruckValidationSchema,
  UpdateTruckValidation,
  TruckQueryParamsSchema,
} from './truck.validation';
import { MongoObjectIdPipe } from '../utils/idValidate.pipe';
import { QueryParamsSchemaPipe } from '../utils/queryParamsValidate.pipe';
import { BodySchemaPipe } from '../utils/bodyValidate.pipe';
import { BodyTransformPipe } from '../utils/bodyTransform.pipe';
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
    @Query(new QueryParamsSchemaPipe(TruckQueryParamsSchema))
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
    @Param('truckId', MongoObjectIdPipe) truckId: Types.ObjectId,
  ): Promise<TruckResultDto> {
    return this.truckService.findTruckById(truckId);
  }

  @Post()
  async createTruck(
    @Req() request: Request,
    @Body(
      new BodySchemaPipe(CreateTruckValidationSchema),
      new BodyTransformPipe(SetUpdatedByToAdmin),
    )
    createTruckBodyDto: CreateTruckDto,
  ): Promise<TruckResultDto> {
    const { user } = request as unknown as {
      user: UserResultDto;
    };
    let newValues: CreateTruckDto = createTruckBodyDto;
    if (createTruckBodyDto.reservedAt && user.id) {
      newValues = { ...createTruckBodyDto, reservedBy: user.id };
    } else if (createTruckBodyDto.reservedAt === null) {
      newValues = {
        ...createTruckBodyDto,
        reservedAt: undefined,
        reservedBy: undefined,
      };
    }
    return this.truckService.createTruck(newValues);
  }

  @Patch(':truckId')
  async updateTruck(
    @Req() request: Request,
    @Param('truckId', MongoObjectIdPipe) truckId: Types.ObjectId,
    @Body(
      new BodySchemaPipe(UpdateTruckValidation),
      new BodyTransformPipe(SetUpdatedByToAdmin),
    )
    updateTruckBodyDto: UpdateTruckDto,
  ): Promise<TruckResultDto> {
    const { user } = request as unknown as {
      user: UserResultDto;
    };
    let newValues: UpdateTruckDto = updateTruckBodyDto;
    if (updateTruckBodyDto.reservedAt && user.id) {
      newValues = { ...updateTruckBodyDto, reservedBy: user.id };
    } else if (updateTruckBodyDto.reservedAt === null) {
      newValues = {
        ...updateTruckBodyDto,
        reservedAt: undefined,
        reservedBy: undefined,
      };
    }
    return this.truckService.updateTruck(truckId, newValues);
  }

  @Delete(':truckId')
  async deleteTruck(
    @Param('truckId', MongoObjectIdPipe) truckId: Types.ObjectId,
  ) {
    return this.truckService.deleteTruck(truckId);
  }
}
