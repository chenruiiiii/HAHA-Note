import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

// /**
//  * 获取逛逛列表
//  * @return {code: number, data: any, message: string}
//  */
export async function GET() {
  const client = await clientPromise;
  const db = client.db('stroll-recommend'); // 逛逛数据库
  const collection = db.collection('recommend_details'); // 集合

  try {
    const data = await collection.find({}).toArray();

    return NextResponse.json({ code: 200, data, message: 'success' });
  } catch (error) {
    console.log('error', error);

    return NextResponse.json({ code: 500, data: error, message: 'error' });
  }
}
