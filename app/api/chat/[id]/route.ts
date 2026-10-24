import { type AiMissionDetail, type ListItem } from '@/models/ai-mission';
import { NextResponse } from 'next/server';
import { isPrismaBackend } from '@/server/auth/backend';
import { requireUser } from '@/server/dal/require-user';
import { findConversationById, softDeleteConversation } from '@/server/dal/conversations';
import { dalErrorResponse, privateJson } from '@/server/http/private-json';

const DB_NAME = 'ai-chat';
const COLLECTION_NAME = 'ai_chat_detail';
const LATEST_MISSION_COLLECTION_NAME = 'latest_mission';
const COLLECT_MISSION_COLLECTION_NAME = 'collect_mission';

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

/**
 * 删除当前用户的一条 AI 会话。
 *
 * Prisma 模式使用 deletedAt 软删除并归档，随后列表与详情接口都会隐藏该会话；
 * Mongo 模式保留历史数据结构，同时清理详情、最近任务和收藏任务集合。
 *
 * @param request - 请求对象，用于解析当前登录用户。
 * @param context - Next.js 路由上下文，`params.id` 为会话 ID。
 * @returns 删除结果；会话不存在或不属于当前用户时返回 404。
 */
export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> }
): Promise<Response> {
  const { id } = await context.params;

  if (isPrismaBackend()) {
    try {
      const user = await requireUser(request);
      const deleted = await softDeleteConversation(id, user.userId);

      if (!deleted) {
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
        data: { id },
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

  try {
    const results = await Promise.all([
      db.collection<AiMissionDetail>(COLLECTION_NAME).deleteOne({ _id: id }),
      db.collection<ListItem>(LATEST_MISSION_COLLECTION_NAME).deleteMany({ docs_id: id }),
      db.collection<ListItem>(COLLECT_MISSION_COLLECTION_NAME).deleteMany({ docs_id: id }),
    ]);
    const deleted = results.some((result) => result.deletedCount > 0);

    if (!deleted) {
      return NextResponse.json(
        {
          code: 404,
          data: null,
          message: '未找到对应聊天详情',
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      code: 200,
      data: { id },
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
