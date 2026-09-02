import {
  ACCESS_TOKEN_COOKIE_NAME,
  LOGIN_ROUTE,
  REFRESH_TOKEN_COOKIE_NAME,
  isPublicAuthPath,
  shouldBypassAuth,
} from '@/middleware/auth';
import {
  clearAuthCookies,
  createAccessToken,
  createRefreshToken,
  getAccessTokenCookieOptions,
  getRefreshTokenCookieOptions,
  shouldRefreshAccessToken,
  verifyAccessToken,
  verifyRefreshToken,
} from '@/lib/auth-token';
import { NextRequest, NextResponse } from 'next/server';

export async function proxy(request: NextRequest) {
  return authProxyWithLogin(request);
}

export async function authProxyWithLogin(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  if (shouldBypassAuth(pathname) || isPublicAuthPath(pathname)) {
    return NextResponse.next();
  }

  const accessToken = request.cookies.get(ACCESS_TOKEN_COOKIE_NAME)?.value;
  const accessResult = await verifyAccessToken(accessToken);

  if (accessResult.valid && accessResult.payload) {
    if (!shouldRefreshAccessToken(accessResult.payload.exp)) {
      return NextResponse.next();
    }

    const refreshedResponse = await tryRefreshSession(request);
    if (refreshedResponse) {
      return refreshedResponse;
    }

    return NextResponse.next();
  }

  const refreshedResponse = await tryRefreshSession(request);
  if (refreshedResponse) {
    return refreshedResponse;
  }

  const loginUrl = new URL(LOGIN_ROUTE, request.url);
  const redirectTarget = `${pathname}${search}`;
  loginUrl.searchParams.set('redirect', redirectTarget);

  const response = NextResponse.redirect(loginUrl);
  clearAuthCookies(response);
  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|monitoring).*)'],
};

async function tryRefreshSession(request: NextRequest) {
  const refreshToken = request.cookies.get(REFRESH_TOKEN_COOKIE_NAME)?.value;

  if (!refreshToken) {
    return null;
  }

  const refreshResult = await verifyRefreshToken(refreshToken);

  if (!refreshResult.valid || !refreshResult.payload?.userId) {
    return null;
  }

  const authUser = {
    userId: refreshResult.payload.userId,
    username: refreshResult.payload.username,
    role: refreshResult.payload.role,
    nickname: refreshResult.payload.nickname,
  };
  const [nextAccessToken, nextRefreshToken] = await Promise.all([
    createAccessToken(authUser),
    createRefreshToken(authUser),
  ]);

  const response = NextResponse.next();
  setAuthCookies(response, nextAccessToken, nextRefreshToken);
  return response;
}

function setAuthCookies(
  response: NextResponse,
  accessToken: string,
  refreshToken: string
) {
  response.cookies.set({
    name: ACCESS_TOKEN_COOKIE_NAME,
    value: accessToken,
    ...getAccessTokenCookieOptions(),
  });

  response.cookies.set({
    name: REFRESH_TOKEN_COOKIE_NAME,
    value: refreshToken,
    ...getRefreshTokenCookieOptions(),
  });
}
