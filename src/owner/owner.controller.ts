import {
    Controller,
    Get,
    Param,
    Query,
    Headers,
    Body,
    Post,
    Patch,
    Delete,
    BadRequestException,
} from '@nestjs/common';
import { OwnerOwnerIdPipe } from './owner.ownerId.pipe';
import { CreateOwnerDto, OwnerQuery, OwnerResultDto, PaginatedOwnerResultDto, UpdateOwnerDto } from './owner.dto';
import { BodyValidationPipe } from '../utils/bodyValidate.pipe';
import { OwnerService } from './owner.service';
import { LoggerService } from '../logger/logger.service';
import { CreateOwnerValidation, UpdateOwnerValidation } from './owner.validation';

@Controller('owner')
export class OwnerController {
    constructor(
        private readonly log: LoggerService,
        private readonly ownerService: OwnerService,
    ) {}

    /*@Get()
    async getOwners(
        @Query(OwnerQueryParamsPipe) ownerQuery: OwnerQuery,
    ): Promise<PaginatedOwnerResultDto> {
        return this.ownerService.getOwners(ownerQuery);
    }*/

    @Get(':ownerId')
    async getOwner(
        @Param('ownerId', OwnerOwnerIdPipe) ownerId: string,
    ): Promise<OwnerResultDto> {
        return this.ownerService.findOwner(ownerId);
    }

    @Post()
    async createOwner(
        @Body(new BodyValidationPipe(CreateOwnerValidation)) createOwnerBodyDto: CreateOwnerDto,
    ): Promise<OwnerResultDto> {
        return this.ownerService.createOwner(createOwnerBodyDto);
    }

    @Patch(':ownerId')
    async updateOwner(
        @Param('ownerId', OwnerOwnerIdPipe) ownerId: string,
        @Body(new BodyValidationPipe(UpdateOwnerValidation)) updateOwnerBodyDto: UpdateOwnerDto,
    ): Promise<OwnerResultDto> {
        return this.ownerService.updateOwner(ownerId, updateOwnerBodyDto);
    }

    @Delete(':ownerId')
    async deleteOwner( @Param('ownerId', OwnerOwnerIdPipe) ownerId: string,) {
        return this.ownerService.deleteOwner(ownerId);
    }
}
