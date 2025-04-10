import * as Joi from 'joi';
import { HEALTH_MEMORY_HEAP_LIMIT, HEALTH_MEMORY_RSS_LIMIT } from '../src/utils/constants';

export const EnvValidationSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test', 'provision')
    .default('production'),
  PORT: Joi.number().port().default(8181),
  SERVICE_NAME: Joi.string().default('Admin_BE'),
  HEAP_LIMIT: Joi.number().positive().default(HEALTH_MEMORY_HEAP_LIMIT),
  RSS_LIMIT: Joi.number().positive().default(HEALTH_MEMORY_RSS_LIMIT),
  MONGO_DSN: Joi.string().default('mongodb://localhost:27017/log4u'),
  MONGO_MAX_POOL_SIZE: Joi.number().positive().default(100),
  MONGO_MIN_POOL_SIZE: Joi.number().positive().default(0),
  MONGO_MAX_CONNECTING: Joi.number().positive().default(2),
  MONGO_IDLE_TIMEOUT: Joi.number().positive().default(0),
  MONGO_QUEUE_TIMEOUT: Joi.number().positive().default(0),
  MONGO_CONNECTION_TIMEOUT: Joi.number().positive().default(3000),
  MONGO_SOCKET_TIMEOUT: Joi.number().positive().default(0),
  LOG_LEVEL: Joi.string()
    .valid('silly', 'debug', 'verbose', 'http', 'info', 'warn', 'error')
    .default('silly'),
  REQUEST_ID_HEADER: Joi.string().default('X-Request-Id'),
  REQUEST_ID_FIELD_NAME: Joi.string().default('requestId'),
  EMAIL_SMTP_HOST: Joi.string().default('smtp.gmail.com'),
  EMAIL_SMTP_PORT: Joi.number().positive().default(587),
  EMAIL_SMTP_SECURE: Joi.boolean().default(true),
  EMAIL_SMTP_USER: Joi.string().default('aa5856bk@gmail.com'),
  EMAIL_SMTP_PASS: Joi.string().default('cess ywcp klbc dalz'),
  EMAIL_QUEUE_MAX_PARALLEL_TASKS: Joi.number().positive().default(10),
  EMAIL_QUEUE_TASK_TIMEOUT: Joi.number().positive().default(1000 * 60 * 5),
  EMAIL_QUEUE_TASK_RESTART_INTERVAL: Joi.number().positive().default(1000 * 60 * 7),
  EMAIL_QUEUE_RESTART_TASKS_OLDER: Joi.number().positive().default(1000 * 60 * 6),
  FILE_MAX_SIZE: Joi.number().positive().default(Infinity),
  GOOGLE_MAPS_API_KEY: Joi.string().default(''),
  EXPO_ACCESS_TOKEN: Joi.string().default('ne-3gfv9eGhxucqmB6qIoQcaF4S_QvBrSv23FWR7'),
  LOAD_CALC_TRUCK_RPM_AVG_RESTART_INTERVAL: Joi.number().positive().default(1000 * 60 * 60 * 3),
  LOAD_QUEUE_MAX_PARALLEL_TASKS: Joi.number().positive().default(10),
  LOAD_QUEUE_TASK_TIMEOUT: Joi.number().positive().default(1000 * 60 * 5),
  PUSH_QUEUE_MAX_PARALEL_TSAKS: Joi.number().positive().default(10),
  PUSH_QUEUE_TASK_TIMEOUT: Joi.number().positive().default(1000 * 60 * 5),
  PUSH_QUEUE_TASK_START_RECEIPT_INTERVAL: Joi.number().positive().default(1000 * 60 * 20),
  PUSH_QUEUE_START_RECEIPT_TASKS_OLDER: Joi.number().positive().default(1000 * 60 * 15),
  PUSH_QUEUE_TASK_RESTART_INTERVAL: Joi.number().positive().default(1000 * 60 * 7),
  PUSH_QUEUE_RESTART_TASKS_OLDER: Joi.number().positive().default(1000 * 60 * 6),
  NEARBY_REDUNDANCY_FACTOR: Joi.number().positive().default(20),
  TRUCK_TO_AVAILABLE_OLDER_THEN: Joi.number().positive().default(1000 * 60 * 60 * 1),
  TRUCK_TO_AVAILABLE_RESTART_INTERVAL: Joi.number().positive().default(1000 * 60 * 5),
  TRUCK_SEND_RENEW_LOCATION_PUSH_OLDER_THEN: Joi.number().positive().default(1000 * 60 * 60 * 24 * 4),
  TRUCK_SEND_RENEW_LOCATION_PUSH_RESTART_INTERVAL: Joi.number().positive().default(1000 * 60 * 5),
  TRUCK_QUEUE_MAX_PARALLEL_TASKS: Joi.number().positive().default(10),
  TRUCK_QUEUE_TASK_TIMEOUT: Joi.number().positive().default(1000 * 60 * 5),
});
