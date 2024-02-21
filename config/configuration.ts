import {
  HEALTH_MEMORY_HEAP_LIMIT,
  HEALTH_MEMORY_RSS_LIMIT,
} from '../src/utils/constants';
import { MongooseModuleFactoryOptions } from '@nestjs/mongoose';

export default (): {
  app: any;
  log: any;
  trucks: { nearByRedundancyFactor: number };
  db: MongooseModuleFactoryOptions;
  google: any;
  email: any;
  emailQueue: { maxParallelTasks: number; taskTimeout: number };
  push: { accessToken: string };
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
  trucks: {
    nearByRedundancyFactor: +(process.env.NEARBY_REDUNDANCY_FACTOR || 20),
  },
  db: {
    uri: process.env.MONGO_DSN || 'mongodb://localhost:27017/log4u',
    appName: process.env.SERVICE_NAME || 'Admin_BE',
    // useNewUrlParser: true,
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
  email: {
    host: process.env.EMAIL_SMTP_HOST || 'smtp.gmail.com',
    port: +(process.env.EMAIL_SMTP_PORT || 587),
    secure: process.env.EMAIL_SMTP_SECURE === 'true',
    user: process.env.EMAIL_SMTP_USER || 'aa5856bk@gmail.com',
    pass: process.env.EMAIL_SMTP_PASS || 'cess ywcp klbc dalz',
  },
  emailQueue: {
    maxParallelTasks: +(process.env.EMAIL_QUEUE_MAX_PARALEL_TSAKS || 10),
    taskTimeout: +(process.env.EMAIL_QUEUE_TASK_TIMEOUT || 1000 * 60 * 5),
  },
  push: {
    accessToken:
      process.env.EXPO_ACCESS_TOKEN ||
      'ne-3gfv9eGhxucqmB6qIoQcaF4S_QvBrSv23FWR7',
  },
});
