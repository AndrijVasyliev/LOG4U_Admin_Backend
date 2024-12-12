import { Controller, Get, Patch, Param, Body } from '@nestjs/common';
import { Types } from 'mongoose';
import {
  // PersonQuery,
  PersonResultDto,
  UpdatePersonSettingsDto,
  // PaginatedPersonResultDto,
  // UpdatePersonAuthDto,
} from './person.dto';
import { BodySchemaPipe } from '../utils/bodyValidate.pipe';
import { PersonService } from './person.service';
import { LoggerService } from '../logger';
import { UpdatePersonSettingsValidation } from './person.validation';
import { MongoObjectIdPipe } from '../utils/idValidate.pipe';
import { Roles } from '../auth/auth.decorator';
// import { QueryParamsSchemaPipe } from '../utils/queryParamsValidate.pipe';

@Controller('person')
@Roles('Admin', 'Super Admin')
export class PersonController {
  constructor(
    private readonly log: LoggerService,
    private readonly personService: PersonService,
  ) {}
  /*@Get()
  async getPersons(
    @Query(new QueryParamsSchemaPipe(PersonQueryParamsSchema))
      personQuery: PersonQuery,
  ): Promise<PaginatedPersonResultDto> {
    return this.personService.getOwners(personQuery);
  }*/

  @Get(':personId')
  async getPerson(
    @Param('personId', MongoObjectIdPipe) personId: Types.ObjectId,
  ): Promise<PersonResultDto> {
    return this.personService.findPersonById(personId);
  }

  @Patch(':personId')
  async updateOwner(
    @Param('personId', MongoObjectIdPipe) personId: Types.ObjectId,
    @Body(new BodySchemaPipe(UpdatePersonSettingsValidation))
    updatePersonSettingsDto: UpdatePersonSettingsDto,
  ): Promise<PersonResultDto> {
    return this.personService.updatePersonSettings(
      personId,
      updatePersonSettingsDto,
    );
  }
}
