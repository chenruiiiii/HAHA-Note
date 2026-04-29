import { LOGIN_COOKIE_NAME } from '@/constants/auth';
import clientPromise from '@/lib/mongodb';
import { AdminUser, AdminUserSchema, LoginPayloadSchema } from '@/models/admin';
import { NextResponse } from 'next/server';

const DB_NAME = 'ha_admin';
const COLLECTION_NAME = 'users';
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7;

async function ensureAdminSeedData() {
  const client = await clientPromise;
  const db = client.db(DB_NAME);
  const collection = db.collection<AdminUser>(COLLECTION_NAME);
  const now = new Date().toISOString();

  const seedUsers = AdminUserSchema.array().parse([
    {
      username: 'admin',
      password: 'admin',
      role: 'admin',
      nickname: '超级管理员',
      enabled: true,
      created_at: now,
      updated_at: now,
    },
    {
      username: 'editor',
      password: 'editor123',
      role: 'editor',
      nickname: '内容编辑',
      enabled: true,
      created_at: now,
      updated_at: now,
    },
  ]);

  const ops = seedUsers.map((user) => ({
    updateOne: {
      filter: { username: user.username },
      update: {
        $setOnInsert: {
          username: user.username,
          created_at: user.created_at,
        },
        $set: {
          password: user.password,
          role: user.role,
          nickname: user.nickname,
          enabled: user.enabled,
          updated_at: now,
        },
      },
      upsert: true,
    },
  }));

  await collection.bulkWrite(ops);
  return collection;
}

export async function POST(request: Request): Promise<Response> {
  try {
    const rawBody = await request.json();
    const payload = LoginPayloadSchema.parse(rawBody);
    const collection = await ensureAdminSeedData();

    const user = await collection.findOne({
      username: payload.username,
      password: payload.password,
      enabled: true,
    });

    if (!user) {
      return NextResponse.json(
        {
          code: 401,
          data: null,
          message: '账号或密码错误',
        },
        { status: 401 }
      );
    }

    const response = NextResponse.json({
      code: 200,
      data: {
        username: user.username,
        role: user.role,
        nickname: user.nickname,
      },
      message: '登录成功',
    });

    response.cookies.set({
      name: LOGIN_COOKIE_NAME,
      value: encodeURIComponent(user.username),
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: COOKIE_MAX_AGE,
    });

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
