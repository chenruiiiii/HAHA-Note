import { ACCESS_TOKEN_COOKIE_NAME, REFRESH_TOKEN_COOKIE_NAME } from '@/constants/auth';
import {
  clearAuthCookies,
  createAccessToken,
  createRefreshToken,
  getAccessTokenCookieOptions,
  getRefreshTokenCookieOptions,
  verifyRefreshToken,
} from '@/lib/auth-token';
import { refreshWithPrisma } from '@/server/auth/auth-service';
import { isPrismaBackend } from '@/server/auth/backend';
import { NextRequest, NextResponse } from 'next/server';

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

export async function POST(request: NextRequest): Promise<Response> {
  const refreshToken = request.cookies.get(REFRESH_TOKEN_COOKIE_NAME)?.value;
  const userAgent = request.headers.get('user-agent');
  const ipHash =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? null;

  if (isPrismaBackend()) {
    const rotated = refreshToken
      ? await refreshWithPrisma(refreshToken, userAgent, ipHash)
      : null;

    if (!rotated) {
      const failed = NextResponse.json(
        { code: 401, data: null, message: '刷新登录状态失败，请重新登录' },
        { status: 401 }
      );
      clearAuthCookies(failed);
      return failed;
    }

    const accessToken = await createAccessToken(rotated.user);
    const response = NextResponse.json({
      code: 200,
      data: rotated.user,
      message: '刷新登录状态成功',
    });
    setAuthCookies(response, accessToken, rotated.refreshToken);
    return response;
  }

  const refreshResult = await verifyRefreshToken(refreshToken);

  if (!refreshResult.valid || !refreshResult.payload?.userId) {
    const response = NextResponse.json(
      { code: 401, data: null, message: '刷新登录状态失败，请重新登录' },
      { status: 401 }
    );

    clearAuthCookies(response);
    return response;
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

  const response = NextResponse.json({
    code: 200,
    data: authUser,
    message: '刷新登录状态成功',
  });
  setAuthCookies(response, nextAccessToken, nextRefreshToken);
  return response;
}
