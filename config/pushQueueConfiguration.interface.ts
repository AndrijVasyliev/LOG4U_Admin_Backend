export interface PushQueueConfiguration {
  maxParallelTasks: number;
  taskTimeout: number;
  taskStartReceiptInterval: number;
  startReceiptForTasksOlder: number;
  taskRestartInterval: number;
  restartTasksOlder: number;
}
