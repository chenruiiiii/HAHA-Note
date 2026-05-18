import clientPromise from '@/lib/mongodb';
import { type ListItem } from '@/models/ai-mission';
import { NextResponse } from 'next/server';

const DB_NAME = 'ai-chat';
const COLLECTION_NAME = 'collect_mission';

/**
 * 获取已收藏的 AI 会话任务列表。
 *
 * @returns 包含收藏任务列表的 JSON 响应；查询失败时返回错误信息。
 */
export async function GET(): Promise<Response> {
  const client = await clientPromise;
  const db = client.db(DB_NAME);
  const collection = db.collection<ListItem>(COLLECTION_NAME);

  try {
    const data = await collection.find({}).toArray();

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
