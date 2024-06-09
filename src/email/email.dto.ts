import { PaginateResult } from 'mongoose';
import { Email, To } from './email.schema';
import {
  EmailState,
  EmailToType,
  PaginatedResultDto,
  Query,
} from '../utils/general.dto';
import { UserResultDto } from '../user/user.dto';
import { PersonResultDto } from '../person/person.dto';
import { User } from '../user/user.schema';
import { Person } from '../person/person.schema';

export class SendEmailDto {
  readonly from: string;
  readonly to: string;
  readonly subject: string;
  readonly text: string;
  readonly html?: string;
}
export class CreateEmailDto {
  readonly from: string;
  readonly to: To[];
  readonly subject: string;
  readonly text: string;
  readonly html?: string;
}

export class UpdateEmailDto {
  readonly state?: EmailState;
  readonly from?: string;
  readonly subject?: string;
  readonly text?: string;
  readonly html?: string;
}

export class EmailQuerySearch {
  readonly state?: EmailState;
  readonly from?: string;
  readonly subject?: string;
}

export class EmailQuery extends Query<EmailQuerySearch> {}

export class ToResultDto {
  static fromToModel(to: To): ToResultDto {
    let toValue: UserResultDto | PersonResultDto;
    switch (to.toType) {
      case 'User':
        toValue = UserResultDto.fromUserModel(to.to as User);
        break;
      case 'Person':
        toValue = PersonResultDto.fromPersonModel(to.to as Person);
        break;
    }
    return {
      to: toValue,
      toType: to.toType,
    };
  }

  readonly to: UserResultDto | PersonResultDto;
  readonly toType: EmailToType;
}

export class EmailResultDto {
  static fromEmailModel(email: Email): EmailResultDto {
    const to = email.to && email.to.map((to) => ToResultDto.fromToModel(to));
    return {
      id: email._id.toString(),
      state: email.state,
      from: email.from,
      to: to,
      subject: email.subject,
      text: email.text,
      html: email.html,
      sendResult: email.sendResult,
      createdAt: email.created_at,
      updatedAt: email.updated_at,
    };
  }

  readonly id: string;
  readonly state: EmailState;
  readonly from: string;
  readonly to: ToResultDto[];
  readonly subject: string;
  readonly text: string;
  readonly html?: string;
  readonly sendResult?: Record<string, any>;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export class PaginatedEmailResultDto extends PaginatedResultDto<EmailResultDto> {
  static from(paginatedEmails: PaginateResult<Email>): PaginatedEmailResultDto {
    return {
      items: paginatedEmails.docs.map((email) =>
        EmailResultDto.fromEmailModel(email),
      ),
      offset: paginatedEmails.offset,
      limit: paginatedEmails.limit,
      total: paginatedEmails.totalDocs,
    };
  }
}
