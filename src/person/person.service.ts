import { mongo, PaginateModel } from 'mongoose';
import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { LoggerService } from '../logger';
import {
  MONGO_CONNECTION_NAME,
  MONGO_UNIQUE_INDEX_CONFLICT,
  UNIQUE_CONSTRAIN_ERROR,
} from '../utils/constants';
import { Person, PersonDocument } from './person.schema';
import {
  PersonAuthResultDto,
  PersonResultDto,
} from './person.dto';
import { AuthDataDto } from '../mobileApp/mobileApp.dto';

const { MongoError } = mongo;

@Injectable()
export class PersonService {
  constructor(
    @InjectModel(Person.name, MONGO_CONNECTION_NAME)
    private readonly personModel: PaginateModel<PersonDocument>,
    private readonly log: LoggerService,
  ) {}

  private async findPersonDocumentById(id: string): Promise<PersonDocument> {
    this.log.debug(`Searching for Person ${id}`);
    const person = await this.personModel.findOne({
      _id: id,
    });
    if (!person) {
      throw new NotFoundException(`Person ${id} was not found`);
    }
    this.log.debug(`Person ${person._id}`);
    return person;
  }

  async findPersonById(id: string): Promise<PersonResultDto> {
    const person = await this.findPersonDocumentById(id);
    return PersonResultDto.fromPersonModel(person);
  }

  async getPersonByCredentials(
    username: string,
    password: string,
  ): Promise<PersonAuthResultDto | null> {
    this.log.debug(`Searching for Person by App credentials ${username}`);
    const person = await this.personModel.findOne({
      appLogin: username,
      appPass: password,
    });
    if (!person) {
      this.log.debug(`Person with App login ${username} was not found`);
      return null;
    }
    this.log.debug(`Person ${person._id}`);
    return PersonAuthResultDto.fromPersonModel(person);
  }

  async getPersonByDeviceId(
    deviceId: string,
  ): Promise<PersonAuthResultDto | null> {
    this.log.debug(`Searching for Person by device Id ${deviceId}`);
    const person = await this.personModel.findOne({
      deviceId,
    });
    if (!person) {
      this.log.debug(`Person with deviceId ${deviceId} was not found`);
      return null;
    }
    this.log.debug(`Person ${person._id}`);
    return PersonAuthResultDto.fromPersonModel(person);
  }

  async setDeviceId(
    id: string,
    deviceId: string,
  ): Promise<PersonAuthResultDto> {
    this.log.debug(`Clearing existing deviceId: ${deviceId}`);
    await this.personModel.updateMany(
      { deviceId },
      { $unset: { deviceId: 1 } },
    );
    this.log.debug(
      `Setting new deviceId: ${deviceId} for Person with id: ${id}`,
    );
    const person = await this.findPersonDocumentById(id);
    person.set('deviceId', deviceId);
    person.set('deviceIdLastChange', new Date());
    try {
      this.log.debug('Saving Person');
      const savedPerson = await person.save();
      this.log.debug(`Driver ${savedPerson._id} saved`);
      return PersonAuthResultDto.fromPersonModel(person);
    } catch (e) {
      if (!(e instanceof Error)) {
        throw new InternalServerErrorException(JSON.stringify(e));
      }
      if (e instanceof MongoError && e.code === MONGO_UNIQUE_INDEX_CONFLICT) {
        throw new ConflictException({ type: UNIQUE_CONSTRAIN_ERROR, e });
      }
      throw new InternalServerErrorException(e.message);
    }
  }

  async setAppData(
    id: string,
    authDataDto: AuthDataDto,
  ): Promise<PersonAuthResultDto> {
    const { token, deviceStatus, appPermissions } = authDataDto;

    const person = await this.findPersonDocumentById(id);
    if (token && person.pushToken !== token) {
      person.set('pushToken', token);
      person.set('pushTokenLastChange', new Date());
    }
    if (deviceStatus) {
      person.set('deviceStatus', deviceStatus);
      person.set('deviceStatusLastChange', new Date());
    }
    if (appPermissions) {
      person.set('appPermissions', appPermissions);
      person.set('appPermissionsLastChange', new Date());
    }

    try {
      this.log.debug('Saving Person');
      const savedPerson = await person.save();
      this.log.debug(`Person ${savedPerson._id} saved`);
      return PersonAuthResultDto.fromPersonModel(person);
    } catch (e) {
      if (!(e instanceof Error)) {
        throw new InternalServerErrorException(JSON.stringify(e));
      }
      throw new InternalServerErrorException(e.message);
    }
  }
}
