import {
  EMAIL_STATES,
  EMAIL_TO_TYPES,
  FILE_OF_TYPES,
  LANG_PRIORITIES,
  PERSON_TYPES,
  PUSH_STATES,
  CUSTOMER_TYPES,
  TRUCK_CERTIFICATES,
  TRUCK_CROSSBORDERS,
  TRUCK_EQUIPMENTS,
  TRUCK_STATUSES,
  TRUCK_TYPES,
  USER_ROLES,
  ADMIN_ROLES,
  MOBILE_ROLES,
} from './constants';

export type GeoPointType = [number, number];

export type MongoGeoPointType = {
  type: 'Point';
  coordinates: GeoPointType;
};

export type PersonType = (typeof PERSON_TYPES)[number];
export type LangPriority = (typeof LANG_PRIORITIES)[number];
export type MobileRole = (typeof MOBILE_ROLES)[number];
export type AdminRole = (typeof ADMIN_ROLES)[number];
export type UserRole = (typeof USER_ROLES)[number];
export type CustomerType = (typeof CUSTOMER_TYPES)[number];
export type TruckType = (typeof TRUCK_TYPES)[number];
export type TruckStatus = (typeof TRUCK_STATUSES)[number];
export type TruckCrossborder = (typeof TRUCK_CROSSBORDERS)[number];
export type TruckCertificate = (typeof TRUCK_CERTIFICATES)[number];
export type TruckEquipment = (typeof TRUCK_EQUIPMENTS)[number];
export type PushState = (typeof PUSH_STATES)[number];
export type EmailState = (typeof EMAIL_STATES)[number];
export type EmailToType = (typeof EMAIL_TO_TYPES)[number];
export type FileOfType = (typeof FILE_OF_TYPES)[number];

export class Query<T> {
  readonly offset: number;
  readonly limit: number;

  readonly orderby?: string;
  readonly direction?: string;

  readonly search?: T;
}

export class PaginatedResultDto<T> {
  readonly items: Array<T>;
  readonly offset: number;
  readonly limit: number;
  readonly total: number;
}
