import { Query } from '../utils/general.dto';

export interface AuthDto {
  force?: boolean;
  deviceId: string;
}
export interface AuthDataDto {
  token?: string;
  deviceStatus?: Record<string, any>;
  appPermissions?: Record<string, any>;
}

export interface MobileLoadQuerySearch {}
export interface MobileLoadQueryOrder {}

export interface MobileLoadQuery
  extends Query<MobileLoadQuerySearch, MobileLoadQueryOrder> {}
