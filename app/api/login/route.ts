import { ACCESS_TOKEN_COOKIE_NAME, REFRESH_TOKEN_COOKIE_NAME } from '@/constants/auth';
import {
  createAccessToken,
  createRefreshToken,
  getAccessTokenCookieOptions,
  getRefreshTokenCookieOptions,
} from '@/lib/auth-token';
import clientPromise from '@/lib/mongodb';
import { loginWithPrisma } from '@/server/auth/auth-service';
import { isPrismaBackend } from '@/server/auth/backend';
import { AdminUser, LoginPayloadSchema } from '@/models/admin';
import { NextResponse } from 'next/server';

const DB_NAME = 'ha_admin';
const COLLECTION_NAME = 'users';

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

export async function POST(request: Request): Promise<Response> {
  try {
    const rawBody = await request.json();
    const payload = LoginPayloadSchema.parse(rawBody);
    const userAgent = request.headers.get('user-agent');
    const ipHash =
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? null;

    if (isPrismaBackend()) {
      const result = await loginWithPrisma(
        payload.username,
        payload.password,
        userAgent,
        ipHash
      );

      if (!result) {
        return NextResponse.json(
          { code: 401, data: null, message: '账号或密码错误' },
          { status: 401 }
        );
      }

      const accessToken = await createAccessToken(result.user);
      const response = NextResponse.json({
        code: 200,
        data: result.user,
        message: '登录成功',
      });
      setAuthCookies(response, accessToken, result.refreshToken);
      return response;
    }

    const client = await clientPromise;
    const db = client.db(DB_NAME);
    const collection = db.collection<AdminUser>(COLLECTION_NAME);

    const user = await collection.findOne({
      username: payload.username,
      password: payload.password,
      enabled: true,
    });

    if (!user) {
      return NextResponse.json(
        { code: 401, data: null, message: '账号或密码错误' },
        { status: 401 }
      );
    }

    const authUser = {
      userId: String(user._id ?? user.username),
      username: user.username,
      role: user.role,
      nickname: user.nickname,
    };
    const [accessToken, refreshToken] = await Promise.all([
      createAccessToken(authUser),
      createRefreshToken(authUser),
    ]);

    const response = NextResponse.json({
      code: 200,
      data: authUser,
      message: '登录成功',
    });
    setAuthCookies(response, accessToken, refreshToken);
    return response;
  } catch (error) {
    console.error('login route error', error);

    return NextResponse.json(
      {
        code: 500,
        data: null,
        message: error instanceof Error ? error.message : '登录请求处理失败',
      },
      { status: 500 }
    );
  }
}
