import { PaginateModel, PaginateOptions } from 'mongoose';
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { LoggerService } from '../logger';
import { MONGO_CONNECTION_NAME } from '../utils/constants';
import { Person, PersonDocument } from './person.schema';
import {
  PaginatedPersonResultDto,
  PersonAuthResultDto,
  PersonQuery,
  PersonResultDto,
  UpdatePersonSettingsDto,
} from './person.dto';
import { AuthDataDto } from '../mobileApp/mobileApp.dto';
import { TruckService } from '../truck/truck.service';
import { escapeForRegExp } from '../utils/escapeForRegExp';

@Injectable()
export class PersonService {
  constructor(
    @InjectModel(Person.name, MONGO_CONNECTION_NAME)
    private readonly personModel: PaginateModel<PersonDocument>,
    private readonly truckService: TruckService,
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

  async getPersons(query: PersonQuery): Promise<PaginatedPersonResultDto> {
    this.log.debug(`Searching for Owners: ${JSON.stringify(query)}`);

    const documentQuery: Parameters<typeof this.personModel.paginate>[0] = {};
    if (query.search) {
      const searchParams = Object.entries(query.search);
      searchParams.forEach((entry) => {
        entry[0] !== 'search' &&
          entry[0] !== 'truckNumber' &&
          (documentQuery[entry[0]] = {
            $regex: new RegExp(escapeForRegExp(entry[1]), 'i'),
          });
      });
    }
    if (query?.search?.truckNumber) {
      const truck = await this.truckService.findTruckByNumber(
        query.search.truckNumber,
      );
      const { owner, coordinator, driver } = truck;
      const conditions = [];
      if (owner) {
        conditions.push({ _id: owner.id });
      }
      if (coordinator) {
        conditions.push({ _id: coordinator.id });
      }
      if (driver) {
        conditions.push({ _id: driver.id });
      }
      if (conditions.length === 1) {
        Object.assign(documentQuery, conditions[0]);
      }
      if (conditions.length > 1) {
        documentQuery.$or = conditions;
      }
    }
    if (query?.search?.search) {
      const search = escapeForRegExp(query?.search?.search);
      documentQuery.$or = [
        ...(documentQuery.$or ? documentQuery.$or : []),
        { fullName: { $regex: new RegExp(search, 'i') } },
        { email: { $regex: new RegExp(search, 'i') } },
      ];
    }

    const options: PaginateOptions = {
      limit: query.limit,
      offset: query.offset,
    };
    if (query.direction && query.orderby) {
      options.sort = { [query.orderby]: query.direction };
    }

    const res = await this.personModel.paginate(documentQuery, options);

    return PaginatedPersonResultDto.from(res);
  }

  async updatePersonSettings(
    id: string,
    updatePersonDto: UpdatePersonSettingsDto,
  ): Promise<PersonResultDto> {
    const person = await this.findPersonDocumentById(id);
    this.log.debug(`Setting new values: ${JSON.stringify(updatePersonDto)}`);
    Object.assign(person, updatePersonDto);
    this.log.debug('Saving Person');
    const savedPerson = await person.save();
    this.log.debug(`Person ${savedPerson._id} saved`);

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
    this.log.debug('Saving Person');
    const savedPerson = await person.save();
    this.log.debug(`Driver ${savedPerson._id} saved`);

    return PersonAuthResultDto.fromPersonModel(person);
  }

  async setAppData(
    id: string,
    authDataDto: AuthDataDto,
  ): Promise<PersonAuthResultDto> {
    const { token, deviceStatus, appPermissions } = authDataDto;

    const person = await this.findPersonDocumentById(id);
    if (typeof token === 'string' && person.pushToken !== token) {
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

    this.log.debug('Saving Person');
    const savedPerson = await person.save();
    this.log.debug(`Person ${savedPerson._id} saved`);
    return PersonAuthResultDto.fromPersonModel(person);
  }
}
