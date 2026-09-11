import { type AiMissionDetail } from '@/models/ai-mission';
import { NextResponse } from 'next/server';
import { isPrismaBackend } from '@/server/auth/backend';
import { requireUser } from '@/server/dal/require-user';
import { findConversationById } from '@/server/dal/conversations';
import { dalErrorResponse, privateJson } from '@/server/http/private-json';

const DB_NAME = 'ai-chat';
const COLLECTION_NAME = 'ai_chat_detail';

/**
 * 获取指定 AI 会话详情。
 *
 * Prisma 模式下仅会话拥有者可见；Mongo 模式保留历史行为。
 *
 * @param _request - 请求对象，用于解析当前登录用户。
 * @param context - Next.js 路由上下文，`params.id` 为会话 ID。
 * @returns 会话详情 JSON 响应；会话不存在时返回 404。
 */
export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
): Promise<Response> {
  const { id } = await context.params;

  if (isPrismaBackend()) {
    try {
      const user = await requireUser(_request);
      const data = await findConversationById(id, user.userId);

      if (!data) {
        return privateJson(
          {
            code: 404,
            data: null,
            message: '未找到对应聊天详情',
          },
          { status: 404 }
        );
      }

      return privateJson({
        code: 200,
        data: data as unknown as AiMissionDetail,
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
  const collection = db.collection<AiMissionDetail>(COLLECTION_NAME);

  try {
    const data = await collection.findOne({ _id: id });

    if (!data) {
      return NextResponse.json({
        code: 404,
        data: null,
        message: '未找到对应聊天详情',
      });
    }

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
