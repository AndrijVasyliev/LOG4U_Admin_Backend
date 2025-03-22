import { registerAs } from '@nestjs/config';
import { load } from './configurationSections';
import { LoadConfiguration } from './loadConfiguration.interface';

export default registerAs(load,  (): LoadConfiguration => ({
  taskCalculateTruckRpmAvgInterval: +(
    process.env.LOAD_CALC_TRUCK_RPM_AVG_RESTART_INTERVAL || 1000 * 60 * 60 * 3
  ),
}));
