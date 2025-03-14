import { registerAs } from '@nestjs/config';
import { LoadQueueConfiguration } from './loadQueueConfiguration.interface';

export default registerAs('loadQueue',  (): LoadQueueConfiguration => ({
  maxParallelTasks: +(process.env.LOAD_QUEUE_MAX_PARALEL_TSAKS || 10),
  taskTimeout: +(process.env.LOAD_QUEUE_TASK_TIMEOUT || 1000 * 60 * 5),
}));
