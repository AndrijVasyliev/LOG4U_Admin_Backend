import {
  HEALTH_MEMORY_HEAP_LIMIT,
  HEALTH_MEMORY_RSS_LIMIT,
} from '../src/utils/constants';

export default () => ({
  app: {
    port: +(process.env.PORT || 8181),
    serviceName: process.env.SERVICE_NAME || 'Admin_BE',
    heapLimit:
      (process.env.HEAP_LIMIT &&
        Number.isFinite(process.env.HEAP_LIMIT) &&
        +process.env.HEAP_LIMIT) ||
      HEALTH_MEMORY_HEAP_LIMIT,
    rssLimit:
      (process.env.RSS_LIMIT &&
        Number.isFinite(process.env.RSS_LIMIT) &&
        +process.env.RSS_LIMIT) ||
      HEALTH_MEMORY_RSS_LIMIT,
  },
  log: {
    level: process.env.LOG_LEVEL || 'silly',
    format: process.env.NODE_ENV === 'development' ? 'string' : 'json',
  },
  db: {
    uri: process.env.MONGO_DSN || 'mongodb://localhost:27017/log4u',
    options: {
      autoIndex: false,
      useNewUrlParser: true,
      useUnifiedTopology: true,
      keepAlive: true,
      connectTimeoutMS: +(process.env.DBCONNECTIONTIMEOUT || 60000),
      socketTimeoutMS: +(process.env.DBSOCKETTIMEOUT || 300000),
    },
  },
  google: {
    key: process.env.GOOGLE_MAPS_API_KEY,
    distanceMatrixBaseUri:
      process.env.GOOGLE_MAPS_DISTANCE_MATRIX_URI ||
      'https://maps.googleapis.com/maps/api/distancematrix/json',
  },
});
