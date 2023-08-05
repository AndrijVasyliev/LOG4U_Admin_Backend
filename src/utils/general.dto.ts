import {
  LangPriorities,
  TruckCertificates,
  TruckCrossborders,
  TruckEquipments,
  TruckStatuses,
  TruckTypes,
  UserRoles,
} from './constants';

export type GeoPointType = { type: 'Point'; coordinates: [number, number] };

export type LangPriority = (typeof LangPriorities)[number];
export type UserRole = (typeof UserRoles)[number];
export type TruckType = (typeof TruckTypes)[number];
export type TruckStatus = (typeof TruckStatuses)[number];
export type TruckCrossborder = (typeof TruckCrossborders)[number];
export type TruckCertificate = (typeof TruckCertificates)[number];
export type TruckEquipment = (typeof TruckEquipments)[number];

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
