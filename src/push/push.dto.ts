import { PaginateResult } from 'mongoose';
import { Push } from './push.schema';
import { PushState, PaginatedResultDto, Query } from '../utils/general.dto';
import { PersonResultDto } from '../person/person.dto';

export class SendPushDto {
  to: string;
  sound: string;
  body: string;
  data?: Record<string, any>;
}

export class CreatePushDto {
  readonly to: string;
  readonly title?: string;
  readonly subtitle?: string;
  readonly body?: string;
  readonly data?: Record<string, any>;
  readonly badge?: number;
}

export class UpdatePushDto {
  readonly state?: PushState;
  readonly title?: string;
  readonly subtitle?: string;
  readonly body?: string;
  readonly data?: Record<string, any>;
  readonly badge?: number;
}

export class PushQuerySearch {
  readonly state?: PushState;
  readonly title?: string;
  readonly subtitle?: string;
  readonly body?: string;
}

export class PushQuery extends Query<PushQuerySearch> {}

export class PushResultDto {
  static fromPushModel(push: Push): PushResultDto {
    const person = push.to && PersonResultDto.fromPersonModel(push.to);
    return {
      id: push._id.toString(),
      state: push.state,
      to: person,
      title: push.title,
      subtitle: push.subtitle,
      body: push.body,
      data: push.data,
      badge: push.badge,
      sendResult: push.sendResult,
      receiptResult: push.receiptResult,
    };
  }

  readonly id: string;
  readonly state: PushState;
  readonly to: PersonResultDto;
  readonly title?: string;
  readonly subtitle?: string;
  readonly body?: string;
  readonly data?: Record<string, any>;
  readonly badge?: number;
  readonly sendResult?: Record<string, any>;
  readonly receiptResult?: Record<string, any>;
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
