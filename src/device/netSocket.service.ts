import { createServer, Server, Socket } from 'node:net';
import { promisify } from 'node:util';
import { Injectable, OnApplicationBootstrap, OnApplicationShutdown } from '@nestjs/common';
// import {} from './device.dto';
import { LoggerService } from '../logger';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class NetSocketService
  implements OnApplicationBootstrap, OnApplicationShutdown
{
  private readonly server: Server;
  constructor(
    private readonly configService: ConfigService,
    private readonly log: LoggerService
  ) {
    this.OnListen = this.OnListen.bind(this);
    this.OnDrop = this.OnDrop.bind(this);
    this.OnServerError = this.OnServerError.bind(this);
    this.OnClose = this.OnClose.bind(this);
    this.OnNewConnection = this.OnNewConnection.bind(this);

    this.server = createServer({},this.OnNewConnection); // ToDo implement metrics using server.getConnections
    this.server.on('error', this.OnServerError);
    this.server.on('drop', this.OnDrop);
    this.server.on('close', this.OnClose);
  }

  async onApplicationBootstrap(): Promise<void> {
    const port = this.configService.get<string>('netServer.port');
    await this.server.listen(port, this.OnListen);
  }

  async onApplicationShutdown(): Promise<void> {
    await this.server.close(this.OnClose);
  }

  private OnListen(): void {
    this.log.info('Listening');
  }

  private OnDrop(): void {
    this.log.warn('Server dropped incoming connection');
  }

  private OnServerError(error: any): void {
    this.log.error('TCP server error', error);
  }

  private OnClose(): void {
    this.log.info('Server stopped');
  }

  private OnNewConnection(newSocket: Socket): void {
    // 'connection' listener.
    this.log.info('client connected');
    newSocket.on('end', () => {
      this.log.info('client disconnected');
    });
    newSocket.write('hello\r\n');
    newSocket.pipe(newSocket);
    newSocket.on('data', (data) => {
      this.log.info(`data ${data}`);
    });
  }
}
