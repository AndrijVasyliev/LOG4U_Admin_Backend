export interface EmailQueueConfiguration {
  maxParallelTasks: number;
  taskTimeout: number;
  taskRestartInterval: number;
  restartTasksOlder: number;
}
