import { registerAs } from '@nestjs/config';
import { loadQueue } from './configurationSections';
import { LoadQueueConfiguration } from './loadQueueConfiguration.interface';

export default registerAs(loadQueue,  (): LoadQueueConfiguration => ({
  maxParallelTasks: +process.env.LOAD_QUEUE_MAX_PARALLEL_TASKS!,
  taskTimeout: +process.env.LOAD_QUEUE_TASK_TIMEOUT!,
}));
