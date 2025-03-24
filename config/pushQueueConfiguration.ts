import { registerAs } from '@nestjs/config';
import { pushQueue } from './configurationSections';
import { PushQueueConfiguration } from './pushQueueConfiguration.interface';

export default registerAs(pushQueue,  (): PushQueueConfiguration => ({
  maxParallelTasks: +process.env.PUSH_QUEUE_MAX_PARALEL_TSAKS!,
  taskTimeout: +process.env.PUSH_QUEUE_TASK_TIMEOUT!,
  taskStartReceiptInterval: +process.env.PUSH_QUEUE_TASK_START_RECEIPT_INTERVAL!,
  startReceiptForTasksOlder: +process.env.PUSH_QUEUE_START_RECEIPT_TASKS_OLDER!,
  taskRestartInterval: +process.env.PUSH_QUEUE_TASK_RESTART_INTERVAL!,
  restartTasksOlder: +process.env.PUSH_QUEUE_RESTART_TASKS_OLDER!,
}));
