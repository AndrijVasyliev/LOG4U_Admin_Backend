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
  CreateOwnerDriverDto,
  OwnerDriverQuery,
  OwnerDriverResultDto,
  PaginatedOwnerDriverResultDto,
  UpdateOwnerDriverDto,
} from './ownerDriver.dto';
import { BodySchemaPipe } from '../utils/bodyValidate.pipe';
import { OwnerDriverService } from './ownerDriver.service';
import { LoggerService } from '../logger';
import {
  CreateOwnerDriverValidation,
  UpdateOwnerDriverValidation,
  OwnerDriverQueryParamsSchema,
} from './ownerDriver.validation';
import { MongoObjectIdPipe } from '../utils/idValidate.pipe';
import { QueryParamsSchemaPipe } from '../utils/queryParamsValidate.pipe';
import { Roles } from '../auth/auth.decorator';

@Controller('ownerDriver')
@Roles('Admin', 'Super Admin')
export class OwnerDriverController {
  constructor(
    private readonly log: LoggerService,
    private readonly ownerDriverService: OwnerDriverService,
  ) {}

  @Get()
  async getOwnerDrivers(
    @Query(new QueryParamsSchemaPipe(OwnerDriverQueryParamsSchema))
    ownerDriverQuery: OwnerDriverQuery,
  ): Promise<PaginatedOwnerDriverResultDto> {
    return this.ownerDriverService.getOwnerDrivers(ownerDriverQuery);
  }

  @Get(':ownerDriverId')
  async getOwnerDriver(
    @Param('ownerDriverId', MongoObjectIdPipe) ownerDriverId: Types.ObjectId,
  ): Promise<OwnerDriverResultDto> {
    return this.ownerDriverService.findOwnerDriverById(ownerDriverId);
  }

  @Post()
  async createOwnerDriver(
    @Body(new BodySchemaPipe(CreateOwnerDriverValidation))
    createOwnerDriverBodyDto: CreateOwnerDriverDto,
  ): Promise<OwnerDriverResultDto> {
    return this.ownerDriverService.createOwnerDriver(createOwnerDriverBodyDto);
  }

  @Patch(':ownerDriverId')
  async updateOwnerDriver(
    @Param('ownerDriverId', MongoObjectIdPipe) ownerDriverId: Types.ObjectId,
    @Body(new BodySchemaPipe(UpdateOwnerDriverValidation))
    updateOwnerDriverBodyDto: UpdateOwnerDriverDto,
  ): Promise<OwnerDriverResultDto> {
    return this.ownerDriverService.updateOwnerDriver(
      ownerDriverId,
      updateOwnerDriverBodyDto,
    );
  }

  @Delete(':ownerDriverId')
  async deleteOwnerDriver(
    @Param('ownerDriverId', MongoObjectIdPipe) ownerDriverId: Types.ObjectId,
  ) {
    return this.ownerDriverService.deleteOwnerDriver(ownerDriverId);
  }
}
