import clientPromise from '@/lib/mongodb';
import { NextResponse } from 'next/server';

/**
 * 获取最近编辑过的文件
 * @param request
 * @returns
 */
export async function GET(request: Request): Promise<any> {
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
