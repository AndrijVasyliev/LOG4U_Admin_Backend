import { SetMetadata } from '@nestjs/common';
import { DO_NOT_COLLECT_METRICS_KEY } from '../utils/constants';

export const DoNotCollectMetrics = () =>
  SetMetadata(DO_NOT_COLLECT_METRICS_KEY, true);
