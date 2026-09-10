import { ActivityType } from '@/generated/prisma/client';
import { NextResponse } from 'next/server';
import { isPrismaBackend } from '@/server/auth/backend';
import { listActivities } from '@/server/dal/activities';
import { requireUser } from '@/server/dal/require-user';
import { dalErrorResponse, privateJson } from '@/server/http/private-json';

/**
 * 获取最近浏览过的文件列表。
 *
 * Prisma 模式下返回当前用户的 DOCUMENT_VIEWED 活动；Mongo 模式保留历史行为。
 *
 * @param request - 请求对象，用于解析当前登录用户。
 * @returns 最近浏览记录的 JSON 响应；查询失败时返回错误信息。
 */
export async function GET(request: Request) {
  if (isPrismaBackend()) {
    try {
      const user = await requireUser(request);
      const data = await listActivities(
        user.userId,
        ActivityType.DOCUMENT_VIEWED
      );
      return privateJson(data);
    } catch (error) {
      const response = dalErrorResponse(error);
      return (
        response ??
        privateJson(
          { code: 500, data: [], message: '获取最近浏览记录失败' },
          { status: 500 }
        )
      );
    }
  }

  try {
    const { default: clientPromise } = await import('@/lib/mongodb');
    const client = await clientPromise;
    const db = client.db('user_activity');
    const collection = db.collection('browse_history');
    const data = await collection.find().toArray();
    return NextResponse.json(data);
  } catch (err) {
    console.error('start/browsed route error', err);

    return NextResponse.json(
      {
        code: 500,
        data: [],
        message: '获取最近浏览记录失败',
      },
      { status: 500 }
    );
  }
}
