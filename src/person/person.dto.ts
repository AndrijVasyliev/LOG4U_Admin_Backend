import { Person } from './person.schema';
import { PersonType } from '../utils/general.dto';

export class UpdatePersonAuthDto {
  // readonly fullName?: string;
  // readonly appLogin?: string;
  readonly appPermissions?: Record<string, string>;
  readonly appLastLogin?: Date;
  readonly deviceId?: string;
  readonly deviceIdLastChange?: Date;
  // readonly appPass?: string;
}

export class PersonResultDto {
  static fromPersonModel(person: Person): PersonResultDto {
    return {
      id: person._id.toString(),
      type: person.type,
      fullName: person.fullName,
      isAppInDebugMode: person.isAppInDebugMode,
      appLogin: person.appLogin,
      // appPermissions: person.appPermissions,
      // appLastLogin: person.appLastLogin,
      deviceId: person.deviceId,
      // deviceIdLastChange: person.deviceIdLastChange,
    };
  }

  readonly id: string;
  readonly type: PersonType;
  readonly fullName: string;
  readonly isAppInDebugMode?: boolean;
  readonly appLogin?: string;
  // readonly appPermissions?: Record<string, string>;
  // readonly appLastLogin?: Date;
  readonly deviceId?: string;
  // readonly deviceIdLastChange?: Date;
}
