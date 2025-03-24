import { LogFormat, LogLevel } from '../src/logger';

export interface LogConfiguration {
  level: LogLevel;
  format: LogFormat;
  requestIdHeader: string;
  requestIdFieldName: string;
}
