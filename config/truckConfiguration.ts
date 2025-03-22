import { registerAs } from '@nestjs/config';
import { truck } from './configurationSections';
import { TruckConfiguration } from './truckConfiguration.interface';

export default registerAs(truck,  (): TruckConfiguration => ({
  nearByRedundancyFactor: +(process.env.NEARBY_REDUNDANCY_FACTOR || 20),
  resetToAvailableWillBeOlderThen: +(
    process.env.TRUCK_TO_AVAILABLE_OLDER_THEN || 1000 * 60 * 60 * 1
  ),
  taskSetAvailableInterval: +(
    process.env.TRUCK_TO_AVAILABLE_RESTART_INTERVAL || 1000 * 60 * 5
  ),
  sendRenewLocationPushOlderThen: +(
    process.env.TRUCK_SEND_RENEW_LOCATION_PUSH_OLDER_THEN ||
    1000 * 60 * 60 * 24 * 4
  ),
  taskSendRenewLocationPushInterval: +(
    process.env.TRUCK_SEND_RENEW_LOCATION_PUSH_RESTART_INTERVAL ||
    1000 * 60 * 5
  ),
}));
