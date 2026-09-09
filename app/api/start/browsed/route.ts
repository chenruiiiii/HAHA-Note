import clientPromise from '@/lib/mongodb';
import { NextResponse } from 'next/server';
import { isPrismaBackend } from '@/server/auth/backend';
import { requireUser } from '@/server/dal/require-user';
import { listActivities } from '@/server/dal/activities';
import { ActivityType } from '@/generated/prisma/client';
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
      const data = await listActivities(user.userId, ActivityType.DOCUMENT_VIEWED);
      // 兼容历史契约：返回裸数组
      return NextResponse.json(data);
    } catch (error) {
      const response = dalErrorResponse(error);
      return response ?? privateJson({ code: 500, data: null, message: 'error' }, { status: 500 });
    }
  }

  const client = await clientPromise;
  const db = client.db('user_activity');
  const collection = db.collection('browse_history');
  try {
    const data = await collection.find().toArray();
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json(err);
  }
}
