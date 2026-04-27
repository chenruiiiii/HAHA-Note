import clientPromise from '@/lib/mongodb';
import { type ListItem } from '@/models/ai-mission';
import { NextResponse } from 'next/server';

const DB_NAME = 'ai-chat';
const COLLECTION_NAME = 'latest_mission';

export async function GET(): Promise<Response> {
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
