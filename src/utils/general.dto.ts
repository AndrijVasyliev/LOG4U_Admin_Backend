import { LangPriorities, UserRoles } from './constants';

export type LangPriority = (typeof LangPriorities)[number];
export type UserRole = (typeof UserRoles)[number];

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
