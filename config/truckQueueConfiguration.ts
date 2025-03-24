import { registerAs } from '@nestjs/config';
import { truckQueue } from './configurationSections';
import { TruckQueueConfiguration } from './truckQueueConfiguration.interface';

export default registerAs(truckQueue,  (): TruckQueueConfiguration => ({
  maxParallelTasks: +process.env.TRUCK_QUEUE_MAX_PARALLEL_TASKS!,
  taskTimeout: +process.env.TRUCK_QUEUE_TASK_TIMEOUT!,
}));
