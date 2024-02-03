import { Query } from '../utils/general.dto';

export class AuthDto {
  deviceId?: string;
  appPermissions?: Record<string, string>;
}

export class MobileLoadQuerySearch {}

export class MobileLoadQuery extends Query<MobileLoadQuerySearch> {}
