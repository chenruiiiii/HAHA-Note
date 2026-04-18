import { RepoDetailType } from '@/components/layout/Repository/types';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { NextResponse } from 'next/server';

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
): Promise<Response> {
  const client = await clientPromise;
  const db = client.db('repository');
  const collection = db.collection<RepoDetailType>('repo_list');
  const { id } = await context.params;
  if (!id) {
    return NextResponse.json({ code: 400, message: 'ID 不能为空' });
  }
  try {
    // 2. 直接使用字符串 id 进行查询，不要包裹 new ObjectId()
    const data = await collection.findOne({ _id: id });

    if (!data) {
      return NextResponse.json({
        code: 404,
        data: null,
        message: '未找到对应的知识库',
      });
    }

    return NextResponse.json({ code: 200, data, message: 'success' });
  } catch (error) {
    return NextResponse.json({ code: 500, data: error, message: 'error' });
  }
}
