import { PersonType } from './general.dto';

export const API_PATH_PREFIX = 'api';
export const MOBILE_PATH_PREFIX = 'mobileApp';
// Health
export const HEALTH_MEMORY_HEAP_LIMIT = 150 * 1024 * 1024;
export const HEALTH_MEMORY_RSS_LIMIT = 250 * 1024 * 1024;
// Metrics
export const DO_NOT_COLLECT_METRICS_KEY = 'doNotCollectMetrics';
// Mongo
export const MONGO_CONNECTION_NAME = 'Mongo_';
export const DB_CHECK_TIMEOUT = 500;
export const MONGO_UNIQUE_INDEX_CONFLICT = 11000;
export const UNIQUE_CONSTRAIN_ERROR = 'Unique constrain error';
export const MONGO_FILE_BUCKET_NAME = 'fs';
// Validation & Transform
export const VALIDATION_ERROR = 'Pathparam validation error';
export const PATHPARAM_VALIDATION_ERROR = 'Pathparam validation error';
export const WS_MESSAGE_VALIDATION_ERROR = 'Message validation error';
export const BODY_VALIDATION_ERROR = 'Body validation error';
export const BODY_TRANSFORM_ERROR = 'Body transform error';
export const MIN_FILE_COMMENT_LENGTH = 1;
export const MAX_FILE_COMMENT_LENGTH = 30;
// Auth
export const IS_PUBLIC_KEY = 'isPublic';
export const USER_ROLES_KEY = 'userRoles';
export const ADMIN_BASIC_STRATEGY = 'admin_basic';
export const MOBILE_BASIC_STRATEGY = 'mobile_basic';
// Geospatial
export const EARTH_RADIUS_MILES = 3963.2;
export const MILES_IN_KM = 0.6213711922;
// Pagination
export const DEFAULT_LIMIT = 50;
export const DEFAULT_OFFSET = 0;
// Misc
export const DEFAULT_CHECK_IN_AS = '4ULogistics';

export const EMAIL_QUEUE_ORPHANED_JOB = 'email_queue_orphaned_job';
export const PUSH_QUEUE_ORPHANED_JOB = 'push_queue_orphaned_job';
export const PUSH_QUEUE_START_RECEIPT_JOB = 'push_queue_start_receipt_job';
export const LOAD_CALCULATE_TRUCK_RPM_AVG_JOB =
  'load_calculate_truck_rpm_avg_job';
export const TRUCK_SET_AVAIL_STATUS_JOB = 'truck_set_avail_status_job';
export const TRUCK_SEND_RENEW_LOCATION_PUSH_JOB =
  'truck_set_renew_location_push_job';

export const ORDER_VALUES = ['asc', 'desc'] as const;

export const LANG_PRIORITIES = ['EN', 'UA', 'ES', 'RU'] as const;

export const PERSON_TYPES = [
  'Owner',
  'OwnerDriver',
  'Coordinator',
  'CoordinatorDriver',
  'Driver',
] as const;

export const OWNER_TYPES: PersonType[] = ['Owner', 'OwnerDriver'];
export const COORDINATOR_TYPES: PersonType[] = [
  'Coordinator',
  'CoordinatorDriver',
];
export const DRIVER_TYPES: PersonType[] = [
  'OwnerDriver',
  'CoordinatorDriver',
  'Driver',
];

export const ADMIN_ROLES = ['Admin', 'Super Admin'] as const;
export const MOBILE_ROLES = [
  'Driver',
  'Owner',
  'OwnerDriver',
  'Coordinator',
  'CoordinatorDriver',
] as const;
export const USER_ROLES = [...ADMIN_ROLES, ...MOBILE_ROLES] as const;
export const PUSH_STATES = [
  'New',
  'Ready for send',
  'Processing send',
  'Sent for deliver',
  'Error sending',
  'Ready for receiving receipt',
  'Processing receiving receipt',
  'Sent to user',
  'Error from receipt',
  'Error receiving receipt',
] as const;
export const EMAIL_STATES = [
  'New',
  'Ready',
  'Processing',
  'Sent',
  'Error',
] as const;
export const EMAIL_TO_TYPES = ['User', 'Person'] as const;

export const FILE_OF_TYPES = ['Truck', 'Person', 'Load', 'User'] as const;

export const CUSTOMER_TYPES = [
  'BROKER DOMESTIC',
  'BROKER INTERNATIONAL',
  'FREIGHT FORWARDER DOMESTIC',
  'FREIGHT FORWARDER INTERNATIONAL',
  'SHIPPER/CONSIGNEE DOMESTIC',
  'SHIPPER/CONSIGNEE INTERNATIONAL',
  'OTHER',
] as const;

export const LOCATION_UPDATERS = [
  'Tracking app',
  'Manually from app',
  'Manually from admin',
] as const;

export const TRUCK_TYPES = [
  'Cargo van',
  'Reefer van',
  'Box truck',
  'Box truck Reefer',
  'Straight truck',
  'Hotshot',
  'Tented box',
] as const;

export const TRUCK_STATUSES = [
  'Available',
  'Not Available',
  'Will be available',
  'On route',
] as const;

export const TRUCK_CROSSBORDERS = ['Yes', 'No'] as const;

export const TRUCK_CERTIFICATES = [
  'Hazmat',
  'Tsa',
  'TWIC',
  'Tanker Endorsement',
] as const;

export const TRUCK_EQUIPMENTS = [
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
  'Metal hooks',
  'Reefer',
  'Heater',
] as const;

export const LOAD_STATUSES = [
  'Available',
  'Planned',
  'In Progress',
  'TONU',
  'Cancelled',
  'Completed',
] as const;

export const STOP_PICKUP_STATUSES = [
  'New',
  'On route to PU',
  'On site PU',
  'Loaded, Waiting GTG',
  'GTG',
  'Completed',
] as const;

export const STOP_DELIVERY_STATUSES = [
  'New',
  'On route to DEL',
  'On site DEL',
  'Unloaded, Waiting GTG',
  'GTG',
  'Completed',
] as const;

export const UNITS_OF_WEIGHT = ['LBS', 'KG', 'TON'] as const;
export const UNITS_OF_LENGTH = ['FT', 'IN', 'M', 'CM'] as const;
