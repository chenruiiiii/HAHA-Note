import 'server-only';
import { ACCESS_TOKEN_COOKIE_NAME } from '@/constants/auth';
import { verifyAccessToken } from '@/lib/auth-token';
import type { NextRequest } from 'next/server';

export class UnauthorizedError extends Error {
  constructor(message = '未登录或登录已过期') {
    super(message);
    this.name = 'UnauthorizedError';
  }
}

export interface SessionUser {
  userId: string;
  username: string;
  role: string;
  nickname: string;
}

export async function requireUser(request: NextRequest): Promise<SessionUser> {
  const token = request.cookies.get(ACCESS_TOKEN_COOKIE_NAME)?.value;
  const result = await verifyAccessToken(token);

  if (!result.valid || !result.payload?.userId) {
    throw new UnauthorizedError();
  }

  return {
    userId: result.payload.userId,
    username: result.payload.username,
    role: result.payload.role,
    nickname: result.payload.nickname,
  };
}
