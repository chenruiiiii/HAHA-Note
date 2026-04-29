import { LOGIN_COOKIE_NAME, LOGIN_ROUTE, isPublicAuthPath, shouldBypassAuth } from '@/middleware/auth';
import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  if (shouldBypassAuth(pathname) || isPublicAuthPath(pathname)) {
    return NextResponse.next();
  }

  const loginToken = request.cookies.get(LOGIN_COOKIE_NAME)?.value;

  if (!loginToken) {
    const loginUrl = new URL(LOGIN_ROUTE, request.url);
    const redirectTarget = `${pathname}${search}`;
    loginUrl.searchParams.set('redirect', redirectTarget);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
