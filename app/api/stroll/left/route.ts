import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

// /**
//  * 获取逛逛列表
//  * @return {code: number, data: any, message: string}
//  */
export async function GET(request: Request) {
  const client = await clientPromise;
  const db = client.db('stroll-recommend'); // 逛逛数据库
  const collection = db.collection('recommend_details'); // 集合
  const { searchParams } = new URL(request.url);
  const page = Number(searchParams.get('page')) || 1;
  const limit = Number(searchParams.get('limit')) || 10;

  try {
    const data = await collection
      .find({})
      .skip((page - 1) * limit)
      .limit(limit)
      .toArray();

    return NextResponse.json({ code: 200, data, message: 'success' });
  } catch (error) {
    console.log('error', error);

    return NextResponse.json({ code: 500, data: error, message: 'error' });
  }
}
