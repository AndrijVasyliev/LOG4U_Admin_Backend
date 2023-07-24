export const HEALTH_MEMORY_HEAP_LIMIT = 150 * 1024 * 1024;
export const HEALTH_MEMORY_RSS_LIMIT = 150 * 1024 * 1024;
export const MONGO_UNIQUE_INDEX_CONFLICT = 11000;

export const MIN_USER_ID_LENGTH = 3;
export const MAX_USER_ID_LENGTH = 64;
export const MIN_USER_FIRSTNAME_LENGTH = 2;
export const MAX_USER_FIRSTNAME_LENGTH = 32;
export const MIN_USER_LASTNAME_LENGTH = 2;
export const MAX_USER_LASTNAME_LENGTH = 32;
export const MAX_USER_EMAIL_LENGTH = 64;
export const MAX_USER_SEARCH_LENGTH = 64;
export const TEAM_MEMBERS_DEFAULT_OFFSET = 0;
export const TEAM_MEMBERS_DEFAULT_LIMIT = 10;
export const SEARCHED_USERS_LIMIT = 2000;

export const MIN_ROLE_NAME_LENGTH = 3;
export const MAX_ROLE_NAME_LENGTH = 64;
export const ROLE_NAME_REGEXP = '^[a-z_-]*$';

export const MIN_USER_TEAM_NAME_LENGTH = 1;
export const MAX_USER_TEAM_NAME_LENGTH = 64;
export const USER_TEAM_NAME_REGEXP = '^[\\w -]*$';

export const MIN_USER_TEAM_ID_LENGTH = 1;
export const MAX_USER_TEAM_ID_LENGTH = 64;
export const USER_TEAM_ID_REGEXP = '^[a-z0-9_-]*$';

export const OWNER_DEFAULT_LIMIT = 0;
export const OWNER_DEFAULT_OFFSET = 25;

export const LangPriorities = ['EN', 'UA', 'ES', 'RU'] as const;
