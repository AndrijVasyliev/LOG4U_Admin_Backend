import { PaginateResult, Types } from 'mongoose';
import { Push } from './push.schema';
import { PushState, PaginatedResultDto, Query } from '../utils/general.dto';
import { PersonResultDto } from '../person/person.dto';

/*export interface SendPushDto {
  to: Types.ObjectId;
  sound: string;
  body: string;
  data?: Record<string, any>;
}*/

export interface CreatePushDto {
  readonly to: Types.ObjectId;
  readonly title?: string;
  readonly subtitle?: string;
  readonly body?: string;
  readonly data?: Record<string, any>;
  readonly badge?: number;
}

export interface PushChangeUpdateDocument {
  readonly operationType: 'update';
  readonly updateDescription: {
    readonly updatedFields: {
      readonly state?: PushState;
      readonly __v?: number;
    };
  };
  readonly fullDocument: {
    // readonly field?: Type;
    readonly __v?: number;
  };
  readonly fullDocumentBeforeChange: {
    // readonly field?: Type;
    readonly __v?: number;
  };
}
export interface PushChangeInsertDocument {
  readonly operationType: 'insert';
  readonly fullDocument: {
    // readonly field?: Type;
    readonly __v?: number;
  };
}

export type PushChangeDocument =
  | PushChangeUpdateDocument
  | PushChangeInsertDocument;

export interface UpdatePushDto {
  readonly state?: PushState;
  readonly title?: string;
  readonly subtitle?: string;
  readonly body?: string;
  readonly data?: Record<string, any>;
  readonly badge?: number;
}

export interface PushQuerySearch {
  readonly search?: string;
  readonly truckNumber?: number;
  readonly state?: PushState;
  readonly title?: string;
  readonly subtitle?: string;
  readonly body?: string;
}
export interface PushQueryOrder extends Omit<PushQuerySearch, 'search'> {
  readonly createdAt?: Date;
  readonly updatedAt?: Date;
}

export interface PushQuery extends Query<PushQuerySearch, PushQueryOrder> {}

export class PushResultDto {
  static fromPushModel(push: Push): PushResultDto {
    const person = push.to && PersonResultDto.fromPersonModel(push.to);
    return {
      id: push._id,
      state: push.state,
      to: person,
      title: push.title,
      subtitle: push.subtitle,
      body: push.body,
      data: push.data,
      badge: push.badge,
      sendResult: push.sendResult,
      receiptResult: push.receiptResult,
      createdAt: push.created_at,
      updatedAt: push.updated_at,
    };
  }

  readonly id: Types.ObjectId;
  readonly state: PushState;
  readonly to: PersonResultDto;
  readonly title?: string;
  readonly subtitle?: string;
  readonly body?: string;
  readonly data?: Record<string, any>;
  readonly badge?: number;
  readonly sendResult?: Record<string, any>;
  readonly receiptResult?: Record<string, any>;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export class PaginatedPushResultDto extends PaginatedResultDto<PushResultDto> {
  static from(paginatedPushs: PaginateResult<Push>): PaginatedPushResultDto {
    return {
      items: paginatedPushs.docs.map((push) =>
        PushResultDto.fromPushModel(push),
      ),
      offset: paginatedPushs.offset,
      limit: paginatedPushs.limit,
      total: paginatedPushs.totalDocs,
    };
  }
}
