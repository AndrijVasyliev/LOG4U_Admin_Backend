import { registerAs } from '@nestjs/config';
import { file } from './configurationSections';
import { FileConfiguration } from './fileConfiguration.interface';

export default registerAs(file,  (): FileConfiguration => ({
  maxFileSize: +process.env.FILE_MAX_SIZE!,
}));
