import {
  AUTH_INTERNAL_PUBLIC_PATHS,
  AUTH_WHITELIST,
  LOGIN_COOKIE_NAME,
  LOGIN_ROUTE,
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
    pathname.startsWith('/api/login') || // ← 添加这一行
    pathname.match(/\.[^/]+$/) !== null
  );
}

export { LOGIN_COOKIE_NAME, LOGIN_ROUTE };
