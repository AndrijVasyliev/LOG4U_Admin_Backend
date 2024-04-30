import { UseFilters, UseGuards } from '@nestjs/common';
import {
  WebSocketGateway,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  WsResponse,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import helmet from 'helmet';
import * as compression from 'compression';
import { LoggerService } from '../logger';
import { WsExceptionFilter } from './wsException.filter';
import { WsValidationPipe } from './wsValidate.pipe';
import { ChatMessageValidation } from './chat.validation';
import { WsMobileAuthBasicGuard } from './wsAuth.guard';

@WebSocketGateway({
  path: '/mobileApp/chat',
  transports: ['websocket'],
  upgradeTimeout: 10000,
  connectTimeout: 45000,
  pingInterval: 25000,
  pingTimeout: 20000,
})
@UseGuards(WsMobileAuthBasicGuard)
@UseFilters(WsExceptionFilter)
export class ChatGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  constructor(private readonly log: LoggerService) {}
  @WebSocketServer() private server: Server;

  // Method from OnGatewayInit
  afterInit(io: Server): any {
    this.server = io;
    io.engine.use(helmet());
    io.engine.use(compression());
  }

  // Method from OnGatewayConnection
  handleConnection(socket: Socket, ...args: any[]): any {
    this.log.info(JSON.stringify(socket.handshake));
    this.log.info(JSON.stringify(args));
  }

  // Method from OnGatewayDisconnect
  handleDisconnect(client: Socket): any {}

  @SubscribeMessage('events')
  handleEventsMessage(
    @MessageBody(new WsValidationPipe(ChatMessageValidation)) data: string,
  ): string {
    this.log.info(JSON.stringify(data));
    // throw new Error('Woops');
    return JSON.stringify(data) + ' Resp';
  }

  @SubscribeMessage('message')
  handleMessage(
    @MessageBody() data: string,
    @ConnectedSocket() socket: Socket,
  ): WsResponse<any> {
    this.log.info(JSON.stringify(socket.handshake));
    this.log.info(JSON.stringify(data));
    // throw new WsException('Some test error');
    return { data: data + ' Resp', event: 'tet' };
  }
  /*@SubscribeMessage('events')
  handleEventsMessage(@MessageBody('id') id: number): number {
    return id;
  }*/
}
