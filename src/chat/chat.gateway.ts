import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody, WsResponse,
} from '@nestjs/websockets';
import { LoggerService } from '../logger/logger.service';

@WebSocketGateway(undefined, { namespace: 'driver' }) // ToDo namespace is not working
export class ChatGateway {
  constructor(private readonly log: LoggerService) {}

  @SubscribeMessage('events')
  handleEventsMessage(@MessageBody() data: string): string {
    this.log.info(data);
    return data + ' Resp';
  }

  @SubscribeMessage('message')
  handleMessage(@MessageBody() data: string): WsResponse<any> {
    this.log.info(data);
    return { data: data + ' Resp', event: 'tet' };
  }
  /*@SubscribeMessage('events')
  handleEventsMessage(@MessageBody('id') id: number): number {
    return id;
  }*/
}
