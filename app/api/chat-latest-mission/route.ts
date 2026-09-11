import { type ListItem } from '@/models/ai-mission';
import { NextResponse } from 'next/server';
import { isPrismaBackend } from '@/server/auth/backend';
import { requireUser } from '@/server/dal/require-user';
import { listConversations } from '@/server/dal/conversations';
import { dalErrorResponse, privateJson } from '@/server/http/private-json';

const DB_NAME = 'ai-chat';
const COLLECTION_NAME = 'latest_mission';

/**
 * 获取最近的 AI 会话任务列表。
 *
 * Prisma 模式下仅返回当前用户自己的活跃会话；Mongo 模式保留历史行为。
 *
 * @param request - 请求对象，用于解析当前登录用户。
 * @returns 最近任务列表 JSON 响应；查询失败时返回错误信息。
 */
export async function GET(request: Request): Promise<Response> {
  if (isPrismaBackend()) {
    try {
      const user = await requireUser(request);
      const data = await listConversations(user.userId);

      return privateJson({
        code: 200,
        data: data as unknown as ListItem[],
        message: 'success',
      });
    } catch (error) {
      const response = dalErrorResponse(error);
      return response ?? privateJson({ code: 500, data: null, message: 'error' }, { status: 500 });
    }
  }

  const { default: clientPromise } = await import('@/lib/mongodb');
  const client = await clientPromise;
  const db = client.db(DB_NAME);
  const collection = db.collection<ListItem>(COLLECTION_NAME);

  try {
    // 添加 sort 方法，按 _id 降序排列（倒序）
    const data = await collection.find({}).sort({ _id: -1 }).toArray();

    return NextResponse.json({
      code: 200,
      data,
      message: 'success',
    });
  } catch (error) {
    return NextResponse.json({
      code: 500,
      data: error,
      message: 'error',
    });
  }
}
