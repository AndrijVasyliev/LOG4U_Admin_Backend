import { Owner } from '../owner/owner.schema';
import { Coordinator } from '../coordinator/coordinator.schema';
import { Driver } from '../driver/driver.schema';

export const HEALTH_MEMORY_HEAP_LIMIT = 150 * 1024 * 1024;
export const HEALTH_MEMORY_RSS_LIMIT = 150 * 1024 * 1024;
export const MONGO_UNIQUE_INDEX_CONFLICT = 11000;
export const IS_PUBLIC_KEY = 'isPublic';
export const USER_ROLES_KEY = 'userRoles';

export const EARTH_RADIUS_MILES = 3963.2;
export const MILES_IN_KM = 0.6213711922;

export const DEFAULT_LIMIT = 50;
export const DEFAULT_OFFSET = 0;

export const DEFAULT_CHECK_IN_AS = '4ULogistics';

export const LangPriorities = ['EN', 'UA', 'ES', 'RU'] as const;

export const PersonTypes = [Owner.name, Coordinator.name, Driver.name] as const;

export const UserRoles = ['Admin', 'Super Admin'] as const;

export const TruckTypes = [
  'Cargo van',
  'Reefer van',
  'Box truck',
  'Box truck Reefer',
  'Straight truck',
  'Hotshot',
  'Tented box',
] as const;

export const TruckStatuses = ['Available', 'Not Available'] as const;

export const TruckCrossborders = ['Yes', 'No'] as const;

export const TruckCertificates = [
  'Hazmat',
  'Tsa',
  'TWIC',
  'Tanker Endorsement',
] as const;

export const TruckEquipments = [
  'Dock height risers',
  'Air ride',
  'Lift gate',
  'Keep from freezing',
  'ICC bar',
  'Vertical E-track',
  'Horizontal E-track',
  'Pallet jack',
  'PPE',
  'Ramps',
  'Straps',
  'Loads bars',
  'Blankets',
  'Pads',
  'Fire extinguisher',
] as const;
