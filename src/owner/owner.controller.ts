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
  CreateOwnerDto,
  OwnerQuery,
  OwnerResultDto,
  PaginatedOwnerResultDto,
  UpdateOwnerDto,
} from './owner.dto';
import { BodySchemaPipe } from '../utils/bodyValidate.pipe';
import { OwnerService } from './owner.service';
import { LoggerService } from '../logger';
import {
  CreateOwnerValidationSchema,
  UpdateOwnerValidationSchema,
  OwnerQueryParamsSchema,
} from './owner.validation';
import { MongoObjectIdPipe } from '../utils/idValidate.pipe';
import { QueryParamsSchemaPipe } from '../utils/queryParamsValidate.pipe';
import { Roles } from '../auth/auth.decorator';

@Controller('owner')
@Roles('Admin', 'Super Admin')
export class OwnerController {
  constructor(
    private readonly log: LoggerService,
    private readonly ownerService: OwnerService,
  ) {}

  @Get()
  async getOwners(
    @Query(new QueryParamsSchemaPipe(OwnerQueryParamsSchema))
    ownerQuery: OwnerQuery,
  ): Promise<PaginatedOwnerResultDto> {
    return this.ownerService.getOwners(ownerQuery);
  }

  @Get(':ownerId')
  async getOwner(
    @Param('ownerId', MongoObjectIdPipe) ownerId: Types.ObjectId,
  ): Promise<OwnerResultDto> {
    return this.ownerService.findOwnerById(ownerId);
  }

  @Post()
  async createOwner(
    @Body(new BodySchemaPipe(CreateOwnerValidationSchema))
    createOwnerBodyDto: CreateOwnerDto,
  ): Promise<OwnerResultDto> {
    return this.ownerService.createOwner(createOwnerBodyDto);
  }

  @Patch(':ownerId')
  async updateOwner(
    @Param('ownerId', MongoObjectIdPipe) ownerId: Types.ObjectId,
    @Body(new BodySchemaPipe(UpdateOwnerValidationSchema))
    updateOwnerBodyDto: UpdateOwnerDto,
  ): Promise<OwnerResultDto> {
    return this.ownerService.updateOwner(ownerId, updateOwnerBodyDto);
  }

  @Delete(':ownerId')
  async deleteOwner(
    @Param('ownerId', MongoObjectIdPipe) ownerId: Types.ObjectId,
  ) {
    return this.ownerService.deleteOwner(ownerId);
  }
}
