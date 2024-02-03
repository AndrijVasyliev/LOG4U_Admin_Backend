import { Query } from '../utils/general.dto';

export class AuthDto {
  deviceId: string;
  userPermissions: Record<string, string>;
}

export class MobileLoadQuerySearch {}

export class MobileLoadQuery extends Query<MobileLoadQuerySearch> {}
