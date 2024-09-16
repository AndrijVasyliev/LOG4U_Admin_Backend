import { LatLngArray } from '@googlemaps/google-maps-services-js';
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
  LOAD_STATUSES,
  STOP_PICKUP_STATUSES,
  STOP_DELIVERY_STATUSES,
  UNITS_OF_WEIGHT,
  UNITS_OF_LENGTH,
  ORDER_VALUES,
} from './constants';

export type GeoPointType = LatLngArray;

export type MongoGeoPointType = {
  type: 'Point';
  coordinates: GeoPointType;
};

export type OrderType = (typeof ORDER_VALUES)[number];

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
export type LoadStatus = (typeof LOAD_STATUSES)[number];
export type StopPickupStatus = (typeof STOP_PICKUP_STATUSES)[number];
export type StopDeliveryStatus = (typeof STOP_DELIVERY_STATUSES)[number];
export type UnitOfWeight = (typeof UNITS_OF_WEIGHT)[number];
export type UnitOfLength = (typeof UNITS_OF_LENGTH)[number];

export interface Query<SearchType, OrderType> {
  readonly offset: number;
  readonly limit: number;

  readonly orderby?: keyof OrderType;
  readonly direction?: OrderType;

  readonly search?: SearchType;
}

export class PaginatedResultDto<T> {
  readonly items: Array<T>;
  readonly offset: number;
  readonly limit: number;
  readonly total: number;
}
