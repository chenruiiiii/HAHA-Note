import 'server-only';
import { ACCESS_TOKEN_COOKIE_NAME } from '@/constants/auth';
import { verifyAccessToken } from '@/lib/auth-token';
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

function readCookie(request: Request, name: string): string | undefined {
  const header = request.headers.get('cookie');
  if (!header) {
    return undefined;
  }

  for (const part of header.split(';')) {
    const [key, ...rest] = part.trim().split('=');
    if (key === name) {
      return decodeURIComponent(rest.join('='));
    }
  }

  return undefined;
}

export async function requireUser(request: Request): Promise<SessionUser> {
  const token = readCookie(request, ACCESS_TOKEN_COOKIE_NAME);
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
