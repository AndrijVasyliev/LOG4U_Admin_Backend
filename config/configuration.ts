import {
  HEALTH_MEMORY_HEAP_LIMIT,
  HEALTH_MEMORY_RSS_LIMIT,
} from '../src/utils/constants';
import { MongooseModuleFactoryOptions } from '@nestjs/mongoose';

export default (): {
  app: any;
  log: any;
  db: MongooseModuleFactoryOptions;
  google: any;
} => ({
  app: {
    port: +(process.env.PORT || 8181),
    serviceName: process.env.SERVICE_NAME || 'Admin_BE',
    heapLimit:
      (process.env.HEAP_LIMIT &&
        Number.isFinite(Number(process.env.HEAP_LIMIT)) &&
        +process.env.HEAP_LIMIT) ||
      HEALTH_MEMORY_HEAP_LIMIT,
    rssLimit:
      (process.env.RSS_LIMIT &&
        Number.isFinite(Number(process.env.RSS_LIMIT)) &&
        +process.env.RSS_LIMIT) ||
      HEALTH_MEMORY_RSS_LIMIT,
  },
  log: {
    level: process.env.LOG_LEVEL || 'silly',
    format: process.env.NODE_ENV === 'development' ? 'string' : 'json',
  },
  db: {
    uri: process.env.MONGO_DSN || 'mongodb://localhost:27017/log4u',
    appName: process.env.SERVICE_NAME || 'Admin_BE',
    autoIndex: true,
    autoCreate: true,
    maxPoolSize: +(process.env.MONGO_MAX_POOL_SIZE || 100),
    minPoolSize: +(process.env.MONGO_MIN_POOL_SIZE || 0),
    maxConnecting: +(process.env.MONGO_MAX_CONNECTING || 2),
    maxIdleTimeMS: +(process.env.MONGO_IDLE_TIMEOUT || 0),
    waitQueueTimeoutMS: +(process.env.MONGO_QUEUE_TIMEOUT || 0),
    monitorCommands: false,
    connectTimeoutMS: +(process.env.MONGO_CONNECTION_TIMEOUT || 30000),
    socketTimeoutMS: +(process.env.MONGO_SOCKET_TIMEOUT || 0),
  },
  google: {
    key: process.env.GOOGLE_MAPS_API_KEY,
    distanceMatrixBaseUri:
      process.env.GOOGLE_MAPS_DISTANCE_MATRIX_URI ||
      'https://maps.googleapis.com/maps/api/distancematrix/json',
  },
});
