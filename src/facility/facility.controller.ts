import {
  Controller,
  Get,
  Req,
  Param,
  Query,
  Body,
  Post,
  Patch,
  Delete,
} from '@nestjs/common';
import { Request } from 'express';
import {
  CreateFacilityDto,
  FacilityQuery,
  FacilityQuerySearch,
  FacilityResultDto,
  PaginatedFacilityResultDto,
  UpdateFacilityDto,
} from './facility.dto';
import { BodyValidationPipe } from '../utils/bodyValidate.pipe';
import { FacilityService } from './facility.service';
import { LoggerService } from '../logger';
import {
  CreateFacilityValidation,
  UpdateFacilityValidation,
  FacilityQueryParamsSchema,
} from './facility.validation';
import { MongoObjectIdPipe } from '../utils/idValidate.pipe';
import { QueryParamsPipe } from '../utils/queryParamsValidate.pipe';
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
    @Query(new QueryParamsPipe(FacilityQueryParamsSchema))
    facilityQuery: FacilityQuery,
  ): Promise<PaginatedFacilityResultDto> {
    return this.facilityService.getFacilities(facilityQuery);
  }

  @Get(':facilityId')
  async getFacility(
    @Param('facilityId', MongoObjectIdPipe) facilityId: string,
  ): Promise<FacilityResultDto> {
    return this.facilityService.findFacilityById(facilityId);
  }

  @Post()
  @Roles('Super Admin')
  async createFacility(
    @Body(new BodyValidationPipe(CreateFacilityValidation))
    createFacilityBodyDto: CreateFacilityDto,
  ): Promise<FacilityResultDto> {
    return this.facilityService.createFacility(createFacilityBodyDto);
  }

  @Patch(':facilityId')
  @Roles('Super Admin')
  async updateFacility(
    @Param('facilityId', MongoObjectIdPipe) facilityId: string,
    @Body(new BodyValidationPipe(UpdateFacilityValidation))
    updateFacilityBodyDto: UpdateFacilityDto,
  ): Promise<FacilityResultDto> {
    return this.facilityService.updateFacility(facilityId, updateFacilityBodyDto);
  }

  @Delete(':facilityId')
  @Roles('Super Admin')
  async deleteFacility(@Param('facilityId', MongoObjectIdPipe) facilityId: string) {
    return this.facilityService.deleteFacility(facilityId);
  }
}
