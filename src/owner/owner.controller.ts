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
  CreateOwnerDto,
  OwnerQuery,
  OwnerQuerySearch,
  OwnerResultDto,
  PaginatedOwnerResultDto,
  UpdateOwnerDto,
} from './owner.dto';
import { BodyValidationPipe } from '../utils/bodyValidate.pipe';
import { OwnerService } from './owner.service';
import { LoggerService } from '../logger/logger.service';
import {
  CreateOwnerValidation,
  UpdateOwnerValidation,
  OwnerQueryParamsSchema,
} from './owner.validation';
import { MongoObjectIdPipe } from '../utils/idValidate.pipe';
import { QueryParamsPipe } from '../utils/queryParamsValidate.pipe';
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
    @Query(new QueryParamsPipe<OwnerQuerySearch>(OwnerQueryParamsSchema))
    ownerQuery: OwnerQuery,
  ): Promise<PaginatedOwnerResultDto> {
    return this.ownerService.getOwners(ownerQuery);
  }

  @Get(':ownerId')
  async getOwner(
    @Param('ownerId', MongoObjectIdPipe) ownerId: string,
  ): Promise<OwnerResultDto> {
    return this.ownerService.findOwner(ownerId);
  }

  @Post()
  async createOwner(
    @Body(new BodyValidationPipe(CreateOwnerValidation))
    createOwnerBodyDto: CreateOwnerDto,
  ): Promise<OwnerResultDto> {
    return this.ownerService.createOwner(createOwnerBodyDto);
  }

  @Patch(':ownerId')
  async updateOwner(
    @Param('ownerId', MongoObjectIdPipe) ownerId: string,
    @Body(new BodyValidationPipe(UpdateOwnerValidation))
    updateOwnerBodyDto: UpdateOwnerDto,
  ): Promise<OwnerResultDto> {
    return this.ownerService.updateOwner(ownerId, updateOwnerBodyDto);
  }

  @Delete(':ownerId')
  async deleteOwner(@Param('ownerId', MongoObjectIdPipe) ownerId: string) {
    return this.ownerService.deleteOwner(ownerId);
  }
}
