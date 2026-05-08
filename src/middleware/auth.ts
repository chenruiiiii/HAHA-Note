import {
  ACCESS_TOKEN_COOKIE_NAME,
  AUTH_INTERNAL_PUBLIC_PATHS,
  AUTH_WHITELIST,
  LOGIN_ROUTE,
  REFRESH_TOKEN_COOKIE_NAME,
} from '@/constants/auth';

export function isPublicAuthPath(pathname: string) {
  return [...AUTH_INTERNAL_PUBLIC_PATHS, ...AUTH_WHITELIST].some(
    (path) => pathname === path || pathname.startsWith(`${path}/`)
  );
}

export function shouldBypassAuth(pathname: string) {
  return (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/static') ||
    pathname.startsWith('/images') ||
    pathname.startsWith('/api/public-note') ||
    pathname.startsWith('/api/login') ||
    pathname.startsWith('/api/auth/refresh') ||
    pathname.startsWith('/api/logout') ||
    pathname.match(/\.[^/]+$/) !== null
  );
}

export { ACCESS_TOKEN_COOKIE_NAME, LOGIN_ROUTE, REFRESH_TOKEN_COOKIE_NAME };
