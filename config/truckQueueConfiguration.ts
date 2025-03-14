import { registerAs } from '@nestjs/config';
import { TruckQueueConfiguration } from './truckQueueConfiguration.interface';

export default registerAs('truckQueue',  (): TruckQueueConfiguration => ({
  maxParallelTasks: +(process.env.TRUCK_QUEUE_MAX_PARALEL_TSAKS || 10),
  taskTimeout: +(process.env.TRUCK_QUEUE_TASK_TIMEOUT || 1000 * 60 * 5),
}));
