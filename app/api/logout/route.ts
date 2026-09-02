import { REFRESH_TOKEN_COOKIE_NAME } from '@/constants/auth';
import { clearAuthCookies } from '@/lib/auth-token';
import { logoutWithPrisma } from '@/server/auth/auth-service';
import { isPrismaBackend } from '@/server/auth/backend';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest): Promise<Response> {
  const refreshToken = request.cookies.get(REFRESH_TOKEN_COOKIE_NAME)?.value;

  if (isPrismaBackend() && refreshToken) {
    await logoutWithPrisma(refreshToken);
  }

  const response = NextResponse.json({
    code: 200,
    data: null,
    message: '退出登录成功',
  });

  clearAuthCookies(response);
  return response;
}
