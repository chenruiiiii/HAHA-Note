import clientPromise from '@/lib/mongodb';
import { NextResponse } from 'next/server';

/**
 * 获取最近浏览过的文件列表。
 *
 * @returns 最近浏览记录的 JSON 响应；查询失败时返回错误信息。
 */
export async function GET() {
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
