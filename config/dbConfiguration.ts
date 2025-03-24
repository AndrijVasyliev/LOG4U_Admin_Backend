import { registerAs } from '@nestjs/config';
import { database } from './configurationSections';
import { DbConfiguration } from './dbConfiguration.interface';

export default registerAs(database,  (): DbConfiguration => ({
  uri: process.env.MONGO_DSN!,
  appName: process.env.SERVICE_NAME!,
  // useNewUrlParser: true,
  monitorCommands: false,
  retryAttempts: 0,
  autoIndex: true,
  autoCreate: true,
  maxPoolSize: +process.env.MONGO_MAX_POOL_SIZE!,
  minPoolSize: +process.env.MONGO_MIN_POOL_SIZE!,
  maxConnecting: +process.env.MONGO_MAX_CONNECTING!,
  maxIdleTimeMS: +process.env.MONGO_IDLE_TIMEOUT!,
  waitQueueTimeoutMS: +process.env.MONGO_QUEUE_TIMEOUT!,
  connectTimeoutMS: +process.env.MONGO_CONNECTION_TIMEOUT!,
  socketTimeoutMS: +process.env.MONGO_SOCKET_TIMEOUT!,
}));
