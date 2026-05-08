import { clearAuthCookies } from '@/lib/auth-token';
import { NextResponse } from 'next/server';

export async function POST(): Promise<Response> {
  const response = NextResponse.json({
    code: 200,
    data: null,
    message: '退出登录成功',
  });

  clearAuthCookies(response);

  return response;
}
