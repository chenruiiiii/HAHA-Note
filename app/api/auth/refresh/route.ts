import { ACCESS_TOKEN_COOKIE_NAME, REFRESH_TOKEN_COOKIE_NAME } from '@/constants/auth';
import {
  clearAuthCookies,
  createAccessToken,
  createRefreshToken,
  getAccessTokenCookieOptions,
  getRefreshTokenCookieOptions,
  verifyRefreshToken,
} from '@/lib/auth-token';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest): Promise<Response> {
  const refreshToken = request.cookies.get(REFRESH_TOKEN_COOKIE_NAME)?.value;
  const refreshResult = await verifyRefreshToken(refreshToken);

  if (!refreshResult.valid || !refreshResult.payload) {
    const response = NextResponse.json(
      {
        code: 401,
        data: null,
        message: '刷新登录状态失败，请重新登录',
      },
      { status: 401 }
    );

    clearAuthCookies(response);
    return response;
  }

  const authUser = {
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

  response.cookies.set({
    name: ACCESS_TOKEN_COOKIE_NAME,
    value: nextAccessToken,
    ...getAccessTokenCookieOptions(),
  });

  response.cookies.set({
    name: REFRESH_TOKEN_COOKIE_NAME,
    value: nextRefreshToken,
    ...getRefreshTokenCookieOptions(),
  });

  return response;
}
