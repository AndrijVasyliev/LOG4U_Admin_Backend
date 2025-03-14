import { registerAs } from '@nestjs/config';
import { PushQueueConfiguration } from './pushQueueConfiguration.interface';

export default registerAs('pushQueue',  (): PushQueueConfiguration => ({
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
}));
