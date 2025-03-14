import { registerAs } from '@nestjs/config';
import { PushConfiguration } from './pushConfiguration.interface';

export default registerAs('push',  (): PushConfiguration => ({
  accessToken:
    process.env.EXPO_ACCESS_TOKEN ||
    'ne-3gfv9eGhxucqmB6qIoQcaF4S_QvBrSv23FWR7',
}));
