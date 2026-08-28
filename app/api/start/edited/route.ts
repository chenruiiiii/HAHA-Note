import clientPromise from '@/lib/mongodb';
import { NextResponse } from 'next/server';

/**
 * 获取最近编辑过的文件列表。
 *
 * @returns 最近编辑记录的 JSON 响应；查询失败时返回错误信息。
 */
export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db('user_activity');
    const collection = db.collection('edit_history');
    const data = await collection.find().toArray();
    return NextResponse.json(data);
  } catch (err) {
    console.error('start/edited route error', err);

    return NextResponse.json({
      code: 500,
      data: [],
      message: '获取最近编辑记录失败',
    }, { status: 500 });
  }
}
