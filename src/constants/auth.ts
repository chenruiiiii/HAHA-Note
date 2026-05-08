export const ACCESS_TOKEN_COOKIE_NAME = 'ha_note_access_token';
export const REFRESH_TOKEN_COOKIE_NAME = 'ha_note_refresh_token';
export const LOGIN_ROUTE = '/login';
export const AUTH_WHITELIST: string[] = [];
export const ACCESS_TOKEN_TTL_SECONDS = 60 * 15;
export const REFRESH_TOKEN_TTL_SECONDS = 60 * 60 * 24 * 7;
export const ACCESS_TOKEN_REFRESH_THRESHOLD_SECONDS = 60;

export const AUTH_INTERNAL_PUBLIC_PATHS = [LOGIN_ROUTE, '/login', '/favicon.ico'];
