import { Person } from './person.schema';
import { PersonType } from '../utils/general.dto';

export class UpdatePersonSettingsDto {
  readonly isAppInDebugMode?: boolean;
  readonly useGoogleMaps?: boolean;
  readonly locationOptions?: Record<string, any>;
}

export class PersonAuthResultDto {
  static fromPersonModel(person: Person): PersonAuthResultDto {
    return {
      id: person._id.toString(),
      type: person.type,
      fullName: person.fullName,
      isAppInDebugMode: person.isAppInDebugMode,
      appLogin: person.appLogin,
      deviceId: person.deviceId,
      useGoogleMaps: person.useGoogleMaps,
      locationOptions: person.locationOptions,
    };
  }

  readonly id: string;
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
      id: person._id.toString(),
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

  readonly id: string;
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
