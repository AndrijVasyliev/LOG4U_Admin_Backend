import {
  HEALTH_MEMORY_HEAP_LIMIT,
  HEALTH_MEMORY_RSS_LIMIT,
} from '../src/utils/constants';
import { MongooseModuleFactoryOptions } from '@nestjs/mongoose';

export default (): {
  app: any;
  log: any;
  trucks: {
    nearByRedundancyFactor: number;
    resetToAvailableWillBeOlderThen: number;
    taskSetAvailableInterval: number;
  };
  db: MongooseModuleFactoryOptions;
  google: any;
  email: any;
  emailQueue: {
    maxParallelTasks: number;
    taskTimeout: number;
    taskRestartInterval: number;
    restartTasksOlder: number;
  };
  push: { accessToken: string };
  pushQueue: {
    maxParallelTasks: number;
    taskTimeout: number;
    taskStartReceiptInterval: number;
    startReceiptForTasksOlder: number;
    taskRestartInterval: number;
    restartTasksOlder: number;
  };
  file: { maxFileSize: number };
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
    requestIdHeader: process.env.REQUEST_ID_HEADER
      ? process.env.REQUEST_ID_HEADER
      : 'X-Request-Id',
    requestIdFieldName: process.env.REQUEST_ID_FIELD_NAME
      ? process.env.REQUEST_ID_FIELD_NAME
      : 'requestId',
  },
  trucks: {
    nearByRedundancyFactor: +(process.env.NEARBY_REDUNDANCY_FACTOR || 20),
    resetToAvailableWillBeOlderThen: +(
      process.env.TRUCK_TO_AVAILABLE_OLDER_THEN || 1000 * 60 * 60 * 1
    ),
    taskSetAvailableInterval: +(
      process.env.TRUCK_TO_AVAILABLE_RESTART_INTERVAL || 1000 * 60 * 5
    ),
  },
  db: {
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
    taskRestartInterval: +(
      process.env.EMAIL_QUEUE_TASK_RESTART_INTERVAL || 1000 * 60 * 7
    ),
    restartTasksOlder: +(
      process.env.EMAIL_QUEUE_RESTART_TASKS_OLDER || 1000 * 60 * 6
    ),
  },
  push: {
    accessToken:
      process.env.EXPO_ACCESS_TOKEN ||
      'ne-3gfv9eGhxucqmB6qIoQcaF4S_QvBrSv23FWR7',
  },
  pushQueue: {
    maxParallelTasks: +(process.env.PUSH_QUEUE_MAX_PARALEL_TSAKS || 10),
    taskTimeout: +(process.env.PUSH_QUEUE_TASK_TIMEOUT || 1000 * 60 * 5),
    taskStartReceiptInterval: +(
      process.env.PUSH_QUEUE_TASK_RESTART_INTERVAL || 1000 * 60 * 20
    ),
    startReceiptForTasksOlder: +(
      process.env.PUSH_QUEUE_RESTART_TASKS_OLDER || 1000 * 60 * 15
    ),
    taskRestartInterval: +(
      process.env.PUSH_QUEUE_TASK_RESTART_INTERVAL || 1000 * 60 * 7
    ),
    restartTasksOlder: +(
      process.env.PUSH_QUEUE_RESTART_TASKS_OLDER || 1000 * 60 * 6
    ),
  },
  file: { maxFileSize: +(process.env.FILE_MAX_SIZE || Infinity) },
});
