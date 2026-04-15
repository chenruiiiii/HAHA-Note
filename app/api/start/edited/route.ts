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
  const collection = db.collection('edit_history');
  const { searchParams } = new URL(request.url);
  const page = Number(searchParams.get('page')) || 1;
  const limit = Number(searchParams.get('limit')) || 10;
  try {
    const data = await collection
      .find()
      .skip((page - 1) * limit)
      .limit(limit)
      .toArray();
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json({
      code: 500,
      data: err,
      message: 'error',
    });
  }
}
