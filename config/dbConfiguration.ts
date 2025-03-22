import { registerAs } from '@nestjs/config';
import { database } from './configurationSections';
import { DbConfiguration } from './dbConfiguration.interface';

export default registerAs(database,  (): DbConfiguration => ({
  uri: process.env.MONGO_DSN || 'mongodb://localhost:27017/log4u',
  appName: process.env.SERVICE_NAME || 'Admin_BE',
  // useNewUrlParser: true,
  retryAttempts: 0,
  autoIndex: true,
  autoCreate: true,
  maxPoolSize: +(process.env.MONGO_MAX_POOL_SIZE || 100),
  minPoolSize: +(process.env.MONGO_MIN_POOL_SIZE || 0),
  maxConnecting: +(process.env.MONGO_MAX_CONNECTING || 2),
  maxIdleTimeMS: +(process.env.MONGO_IDLE_TIMEOUT || 0),
  waitQueueTimeoutMS: +(process.env.MONGO_QUEUE_TIMEOUT || 0),
  monitorCommands: false,
  connectTimeoutMS: +(process.env.MONGO_CONNECTION_TIMEOUT || 3000),
  socketTimeoutMS: +(process.env.MONGO_SOCKET_TIMEOUT || 0),
}));
