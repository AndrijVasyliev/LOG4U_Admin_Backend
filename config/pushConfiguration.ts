import { registerAs } from '@nestjs/config';
import { push } from './configurationSections';
import { PushConfiguration } from './pushConfiguration.interface';

export default registerAs(push,  (): PushConfiguration => ({
  accessToken: process.env.EXPO_ACCESS_TOKEN!,
}));
