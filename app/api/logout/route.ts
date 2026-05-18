import { clearAuthCookies } from '@/lib/auth-token';
import { NextResponse } from 'next/server';

/**
 * 退出当前登录并清理认证 Cookie。
 *
 * @returns 退出登录成功的 JSON 响应。
 */
export async function POST(): Promise<Response> {
  const response = NextResponse.json({
    code: 200,
    data: null,
    message: '退出登录成功',
  });

  clearAuthCookies(response);

  return response;
}
