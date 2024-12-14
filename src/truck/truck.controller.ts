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
import {
  CreateTruckValidationSchema,
  UpdateTruckValidationSchema,
  TruckQueryParamsSchema,
} from './truck.validation';
import { LoggerService } from '../logger';
import { MongoObjectIdPipe } from '../utils/idValidate.pipe';
import { QueryParamsSchemaPipe } from '../utils/queryParamsValidate.pipe';
import { BodySchemaPipe } from '../utils/bodyValidate.pipe';
import { BodyTransformPipe } from '../utils/bodyTransform.pipe';
import { User } from '../utils/user.decorator';
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
    @User() user: UserResultDto,
    @Body(
      new BodySchemaPipe(CreateTruckValidationSchema),
      new BodyTransformPipe(SetUpdatedByToAdmin),
    )
    createTruckBodyDto: CreateTruckDto,
  ): Promise<TruckResultDto> {
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
    @User() user: UserResultDto,
    @Param('truckId', MongoObjectIdPipe) truckId: Types.ObjectId,
    @Body(
      new BodySchemaPipe(UpdateTruckValidationSchema),
      new BodyTransformPipe(SetUpdatedByToAdmin),
    )
    updateTruckBodyDto: UpdateTruckDto,
  ): Promise<TruckResultDto> {
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
