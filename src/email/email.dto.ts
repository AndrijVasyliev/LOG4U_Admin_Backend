import { PaginateResult } from 'mongoose';
import { Email, To } from './email.schema';
import { EmailState, PaginatedResultDto, Query } from '../utils/general.dto';

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

export class EmailResultDto {
  static fromEmailModel(email: Email): EmailResultDto {
    return {
      id: email._id.toString(),
      state: email.state,
      from: email.from,
      to: email.to,
      subject: email.subject,
      text: email.text,
      html: email.html,
      sendResult: email.sendResult,
    };
  }

  readonly id: string;
  readonly state: EmailState;
  readonly from: string;
  readonly to: To[];
  readonly subject: string;
  readonly text: string;
  readonly html?: string;
  readonly sendResult?: Record<string, any>;
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
