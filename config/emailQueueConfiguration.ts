import { registerAs } from '@nestjs/config';
import { emailQueue } from './configurationSections';
import { EmailQueueConfiguration } from './emailQueueConfiguration.interface';

export default registerAs(emailQueue,  (): EmailQueueConfiguration => ({
  maxParallelTasks: +(process.env.EMAIL_QUEUE_MAX_PARALEL_TSAKS || 10),
  taskTimeout: +(process.env.EMAIL_QUEUE_TASK_TIMEOUT || 1000 * 60 * 5),
  taskRestartInterval: +(
    process.env.EMAIL_QUEUE_TASK_RESTART_INTERVAL || 1000 * 60 * 7
  ),
  restartTasksOlder: +(
    process.env.EMAIL_QUEUE_RESTART_TASKS_OLDER || 1000 * 60 * 6
  ),
}));
