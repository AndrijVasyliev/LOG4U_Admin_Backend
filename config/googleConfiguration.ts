import { registerAs } from '@nestjs/config';
import { google } from './configurationSections';
import { GoogleConfiguration } from './googleConfiguration.interface';

export default registerAs(google,  (): GoogleConfiguration => ({
  key: process.env.GOOGLE_MAPS_API_KEY!,
}));
