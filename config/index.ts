import appConfig from './appConfiguration';
import logConfig from './logConfiguration';
import dbConfig from './dbConfiguration';
import emailConfig from './emailConfiguration';
import emailQueueConfig from './emailQueueConfiguration';
import googleConfig from './googleConfiguration';
import fileConfig from './fileConfiguration';
import pushConfig from './pushConfiguration';
import pushQueueConfig from './pushQueueConfiguration';
import truckConfig from './truckConfiguration';
import truckQueueConfig from './truckQueueConfiguration';
import loadConfig from './loadConfiguration';
import loadQueueConfig from './loadQueueConfiguration';
import { LogConfiguration } from './logConfiguration.interface';
import { AppConfiguration } from './appConfiguration.interface';
import { DbConfiguration } from './dbConfiguration.interface';
import { EmailConfiguration } from './emailConfiguration.interface';
import { GoogleConfiguration } from './googleConfiguration.interface';
import { FileConfiguration } from './fileConfiguration.interface';
import { PushConfiguration } from './pushConfiguration.interface';
import { PushQueueConfiguration } from './pushQueueConfiguration.interface';
import { TruckConfiguration } from './truckConfiguration.interface';
import { TruckQueueConfiguration } from './truckQueueConfiguration.interface';
import { LoadConfiguration } from './loadConfiguration.interface';
import { LoadQueueConfiguration } from './loadQueueConfiguration.interface';
import { EmailQueueConfiguration } from './emailQueueConfiguration.interface';
import {
  application,
  logger,
  database,
  email,
  emailQueue,
  google,
  file,
  push,
  pushQueue,
  truck,
  truckQueue,
  load,
  loadQueue,
} from './configurationSections';

export interface Configuration {
  [application]: AppConfiguration;
  [logger]: LogConfiguration;
  [database]: DbConfiguration;
  [email]: EmailConfiguration;
  [emailQueue]: EmailQueueConfiguration;
  [google]: GoogleConfiguration;
  [file]: FileConfiguration;
  [push]: PushConfiguration;
  [pushQueue]: PushQueueConfiguration;
  [truck]: TruckConfiguration;
  [truckQueue]: TruckQueueConfiguration;
  [load]: LoadConfiguration;
  [loadQueue]: LoadQueueConfiguration;
}

export {
  AppConfiguration,
  LogConfiguration,
  DbConfiguration,
  EmailConfiguration,
  EmailQueueConfiguration,
  GoogleConfiguration,
  FileConfiguration,
  PushConfiguration,
  PushQueueConfiguration,
  TruckConfiguration,
  TruckQueueConfiguration,
  LoadConfiguration,
  LoadQueueConfiguration,
  appConfig,
  logConfig,
  dbConfig,
  emailConfig,
  emailQueueConfig,
  googleConfig,
  fileConfig,
  pushConfig,
  pushQueueConfig,
  truckConfig,
  truckQueueConfig,
  loadConfig,
  loadQueueConfig,
};

export default [
  appConfig,
  logConfig,
  dbConfig,
  emailConfig,
  emailQueueConfig,
  googleConfig,
  fileConfig,
  pushConfig,
  pushQueueConfig,
  truckConfig,
  truckQueueConfig,
  loadConfig,
  loadQueueConfig,
];
