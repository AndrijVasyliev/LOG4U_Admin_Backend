import { Person } from './person.schema';
import { PersonType } from '../utils/general.dto';

export class UpdatePersonDto {
  readonly fullName?: string;
  readonly appPermissions?: Record<string, string>;
  readonly appLastLogin?: Date;
  readonly appLogin?: string;
  readonly deviceId?: string;
  readonly appPass?: string;
}

export class PersonResultDto {
  static fromPersonModel(person: Person): PersonResultDto {
    return {
      id: person._id.toString(),
      type: person.type,
      fullName: person.fullName,
      appPermissions: person.appPermissions,
      appLastLogin: person.appLastLogin,
      appLogin: person.appLogin,
      deviceId: person.deviceId,
      appPass: person.appPass,
    };
  }

  readonly id: string;
  readonly type: PersonType;
  readonly fullName: string;
  readonly appPermissions?: Record<string, string>;
  readonly appLastLogin?: Date;
  readonly appLogin?: string;
  readonly deviceId?: string;
  readonly appPass?: string;
}
