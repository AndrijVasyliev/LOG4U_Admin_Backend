import { Query } from '../utils/general.dto';

export class AuthDto {
  force?: boolean;
  deviceId: string;
}
export class AuthDataDto {
  token?: string;
  deviceStatus?: Record<string, any>;
  appPermissions?: Record<string, any>;
}

export class MobileLoadQuerySearch {}

export interface MobileLoadQuery extends Query<MobileLoadQuerySearch> {}
