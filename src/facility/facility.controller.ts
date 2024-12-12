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
  CreateFacilityDto,
  FacilityQuery,
  FacilityResultDto,
  PaginatedFacilityResultDto,
  UpdateFacilityDto,
} from './facility.dto';
import { BodySchemaPipe } from '../utils/bodyValidate.pipe';
import { FacilityService } from './facility.service';
import { LoggerService } from '../logger';
import {
  CreateFacilityValidation,
  UpdateFacilityValidation,
  FacilityQueryParamsSchema,
} from './facility.validation';
import { MongoObjectIdPipe } from '../utils/idValidate.pipe';
import { QueryParamsSchemaPipe } from '../utils/queryParamsValidate.pipe';
import { Roles } from '../auth/auth.decorator';

@Controller('facility')
@Roles('Admin', 'Super Admin')
export class FacilityController {
  constructor(
    private readonly log: LoggerService,
    private readonly facilityService: FacilityService,
  ) {}

  @Get()
  async getFacilities(
    @Query(new QueryParamsSchemaPipe(FacilityQueryParamsSchema))
    facilityQuery: FacilityQuery,
  ): Promise<PaginatedFacilityResultDto> {
    return this.facilityService.getFacilities(facilityQuery);
  }

  @Get(':facilityId')
  async getFacility(
    @Param('facilityId', MongoObjectIdPipe) facilityId: Types.ObjectId,
  ): Promise<FacilityResultDto> {
    return this.facilityService.findFacilityById(facilityId);
  }

  @Post()
  // @Roles('Super Admin')
  async createFacility(
    @Body(new BodySchemaPipe(CreateFacilityValidation))
    createFacilityBodyDto: CreateFacilityDto,
  ): Promise<FacilityResultDto> {
    return this.facilityService.createFacility(createFacilityBodyDto);
  }

  @Patch(':facilityId')
  // @Roles('Super Admin')
  async updateFacility(
    @Param('facilityId', MongoObjectIdPipe) facilityId: Types.ObjectId,
    @Body(new BodySchemaPipe(UpdateFacilityValidation))
    updateFacilityBodyDto: UpdateFacilityDto,
  ): Promise<FacilityResultDto> {
    return this.facilityService.updateFacility(
      facilityId,
      updateFacilityBodyDto,
    );
  }

  @Delete(':facilityId')
  // @Roles('Super Admin')
  async deleteFacility(
    @Param('facilityId', MongoObjectIdPipe) facilityId: Types.ObjectId,
  ) {
    return this.facilityService.deleteFacility(facilityId);
  }
}
