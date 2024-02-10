export class SendPushDto {
  to: string;
  sound: string;
  body: string;
  data?: Record<string, any>;
}
