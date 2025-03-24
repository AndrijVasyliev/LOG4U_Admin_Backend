import { registerAs } from '@nestjs/config';
import { truck } from './configurationSections';
import { TruckConfiguration } from './truckConfiguration.interface';

export default registerAs(truck,  (): TruckConfiguration => ({
  nearByRedundancyFactor: +process.env.NEARBY_REDUNDANCY_FACTOR!,
  resetToAvailableWillBeOlderThen: +process.env.TRUCK_TO_AVAILABLE_OLDER_THEN!,
  taskSetAvailableInterval: +process.env.TRUCK_TO_AVAILABLE_RESTART_INTERVAL!,
  sendRenewLocationPushOlderThen: +process.env.TRUCK_SEND_RENEW_LOCATION_PUSH_OLDER_THEN!,
  taskSendRenewLocationPushInterval: +process.env.TRUCK_SEND_RENEW_LOCATION_PUSH_RESTART_INTERVAL!,
}));
