import { Query } from '../utils/general.dto';

export class AuthDto {
  force?: boolean;
  deviceId?: string;
  appPermissions?: Record<string, any>;
}

export class MobileLoadQuerySearch {}

export class MobileLoadQuery extends Query<MobileLoadQuerySearch> {}
