import { Controller, Get, Param } from '@nestjs/common';
import {
  // PersonQuery,
  // PersonQuerySearch,
  PersonResultDto,
  // PaginatedPersonResultDto,
  // UpdatePersonAuthDto,
} from './person.dto';
// import { BodyValidationPipe } from '../utils/bodyValidate.pipe';
import { PersonService } from './person.service';
import { LoggerService } from '../logger';
// import { UpdatePersonValidation, PersonQueryParamsSchema } from './person.validation';
import { MongoObjectIdPipe } from '../utils/idValidate.pipe';
import { Roles } from '../auth/auth.decorator';
// import { QueryParamsPipe } from '../utils/queryParamsValidate.pipe';

@Controller('person')
@Roles('Admin', 'Super Admin')
export class PersonController {
  constructor(
    private readonly log: LoggerService,
    private readonly personService: PersonService,
  ) {}
  /*@Get()
  async getPersons(
    @Query(new QueryParamsPipe<PersonQuerySearch>(PersonQueryParamsSchema))
      personQuery: PersonQuery,
  ): Promise<PaginatedPersonResultDto> {
    return this.personService.getOwners(personQuery);
  }*/

  @Get(':personId')
  async getPerson(
    @Param('personId', MongoObjectIdPipe) personId: string,
  ): Promise<PersonResultDto> {
    return this.personService.findPersonById(personId);
  }

  /*@Patch(':personId')
  async updateOwner(
    @Param('personId', MongoObjectIdPipe) personId: string,
    @Body(new BodyValidationPipe(UpdatePersonValidation))
    updatePersonBodyDto: UpdatePersonAuthDto,
  ): Promise<PersonResultDto> {
    return this.personService.setAuthData(personId, updatePersonBodyDto);
  }*/
}
