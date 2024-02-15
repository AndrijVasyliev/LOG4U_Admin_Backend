export class SendEmailDto {
  readonly from: string;
  to: string;
  subject: string;
  text: string;
  html?: string;
}
