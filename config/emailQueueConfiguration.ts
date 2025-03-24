import { registerAs } from '@nestjs/config';
import { emailQueue } from './configurationSections';
import { EmailQueueConfiguration } from './emailQueueConfiguration.interface';

export default registerAs(emailQueue,  (): EmailQueueConfiguration => ({
  maxParallelTasks: +process.env.EMAIL_QUEUE_MAX_PARALLEL_TASKS!,
  taskTimeout: +process.env.EMAIL_QUEUE_TASK_TIMEOUT!,
  taskRestartInterval: +process.env.EMAIL_QUEUE_TASK_RESTART_INTERVAL!,
  restartTasksOlder: +process.env.EMAIL_QUEUE_RESTART_TASKS_OLDER!,
}));
