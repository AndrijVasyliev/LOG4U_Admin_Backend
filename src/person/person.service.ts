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
import { PersonResultDto, UpdatePersonAuthDto } from './person.dto';

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

  async getPersonByCredentials(
    username: string,
    password: string,
  ): Promise<PersonResultDto | null> {
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
    return PersonResultDto.fromPersonModel(person);
  }

  async getPersonByDeviceId(deviceId: string): Promise<PersonResultDto | null> {
    this.log.debug(`Searching for Person by device Id ${deviceId}`);
    const person = await this.personModel.findOne({
      deviceId,
    });
    if (!person) {
      this.log.debug(`Person with deviceId ${deviceId} was not found`);
      return null;
    }
    this.log.debug(`Person ${person._id}`);
    return PersonResultDto.fromPersonModel(person);
  }

  async setDeviceId(id: string, deviceId: string): Promise<PersonResultDto> {
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
    try {
      this.log.debug('Saving Person');
      const savedPerson = await person.save();
      this.log.debug(`Driver ${savedPerson._id} saved`);
      return PersonResultDto.fromPersonModel(person);
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

  async setAuthData(
    id: string,
    updatePersonAuthDto: UpdatePersonAuthDto,
  ): Promise<PersonResultDto> {
    const { deviceId } = updatePersonAuthDto;
    if (deviceId) {
      this.log.debug(`Clearing existing deviceId: ${deviceId}`);
      await this.personModel.updateMany(
        { deviceId },
        { $unset: { deviceId: 1 } },
      );
    }

    const person = await this.findPersonDocumentById(id);
    Object.assign(person, updatePersonAuthDto);

    try {
      this.log.debug('Saving Person');
      const savedPerson = await person.save();
      this.log.debug(`Person ${savedPerson._id} saved`);
      return PersonResultDto.fromPersonModel(person);
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
}
