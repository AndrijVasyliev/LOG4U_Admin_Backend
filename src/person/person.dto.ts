import { Person } from './person.schema';
import { PaginatedResultDto, PersonType, Query } from '../utils/general.dto';
import { PaginateResult, Types } from 'mongoose';

export interface UpdatePersonSettingsDto {
  readonly isAppInDebugMode?: boolean;
  readonly useGoogleMaps?: boolean;
  readonly locationOptions?: Record<string, any>;
}

export interface PersonQuerySearch {
  readonly search?: string;
  readonly fullName?: string;
  readonly email?: string;
  readonly truckNumber?: number;
}

export interface PersonQueryOrder
  extends Omit<PersonQuerySearch, 'search' | 'truckNumber'> {}

export interface PersonQuery
  extends Query<PersonQuerySearch, PersonQueryOrder> {}

export class PersonAuthResultDto {
  static fromPersonModel(person: Person): PersonAuthResultDto {
    return {
      id: person._id,
      type: person.type,
      fullName: person.fullName,
      isAppInDebugMode: person.isAppInDebugMode,
      appLogin: person.appLogin,
      deviceId: person.deviceId,
      useGoogleMaps: person.useGoogleMaps,
      locationOptions: person.locationOptions,
    };
  }

  readonly id: Types.ObjectId;
  readonly type: PersonType;
  readonly fullName: string;
  readonly isAppInDebugMode?: boolean;
  readonly appLogin?: string;
  readonly deviceId?: string;
  readonly useGoogleMaps?: boolean;
  readonly locationOptions?: Record<string, any>;
}

export class PersonResultDto {
  static fromPersonModel(person: Person): PersonResultDto {
    return {
      id: person._id,
      type: person.type,
      fullName: person.fullName,
      isAppInDebugMode: person.isAppInDebugMode,
      useGoogleMaps: person.useGoogleMaps,
      locationOptions: person.locationOptions,
      appLogin: person.appLogin,
      deviceStatus: person.deviceStatus,
      deviceStatusLastChange: person.appPermissionsLastChange,
      appPermissions: person.appPermissions,
      appPermissionsLastChange: person.appPermissionsLastChange,
      deviceId: person.deviceId,
      deviceIdLastChange: person.deviceIdLastChange,
      pushToken: person.pushToken,
      pushTokenLastChange: person.pushTokenLastChange,
    };
  }

  readonly id: Types.ObjectId;
  readonly type: PersonType;
  readonly fullName: string;
  readonly isAppInDebugMode?: boolean;
  readonly useGoogleMaps?: boolean;
  readonly locationOptions?: Record<string, any>;
  readonly appLogin?: string;
  readonly deviceStatus?: Record<string, any>;
  readonly deviceStatusLastChange?: Date;
  readonly appPermissions?: Record<string, any>;
  readonly appPermissionsLastChange?: Date;
  readonly deviceId?: string;
  readonly deviceIdLastChange?: Date;
  readonly pushToken?: string;
  readonly pushTokenLastChange?: Date;
}

export class PaginatedPersonResultDto extends PaginatedResultDto<PersonResultDto> {
  static from(
    paginatedPersons: PaginateResult<Person>,
  ): PaginatedPersonResultDto {
    return {
      items: paginatedPersons.docs.map((person) =>
        PersonResultDto.fromPersonModel(person),
      ),
      offset: paginatedPersons.offset,
      limit: paginatedPersons.limit,
      total: paginatedPersons.totalDocs,
    };
  }
}
