import clientPromise from '@/lib/mongodb';
import { type AiMissionDetail } from '@/models/ai-mission';
import { NextResponse } from 'next/server';

const DB_NAME = 'ai-chat';
const COLLECTION_NAME = 'ai_chat_detail';

/**
 * 获取指定 AI 会话详情。
 *
 * @param _request - 请求对象，当前接口未读取请求内容。
 * @param context - Next.js 路由上下文，`params.id` 为会话 ID。
 * @returns 会话详情 JSON 响应；会话不存在时返回 404。
 */
export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
): Promise<Response> {
  const client = await clientPromise;
  const db = client.db(DB_NAME);
  const collection = db.collection<AiMissionDetail>(COLLECTION_NAME);
  const { id } = await context.params;

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
