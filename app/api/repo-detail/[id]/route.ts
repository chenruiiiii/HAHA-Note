import { RepoDetailType } from '@/components/layout/Repository/types';
import clientPromise from '@/lib/mongodb';
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

/**
 * 更新指定知识库的收藏状态。
 */
export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
): Promise<Response> {
  const client = await clientPromise;
  const db = client.db('repository');
  const collection = db.collection<RepoDetailType>('repo_list');
  const { id } = await context.params;

  if (!id) {
    return NextResponse.json({ code: 400, data: null, message: 'ID 不能为空' });
  }

  try {
    const body = (await request.json()) as { isCollect?: boolean };

    if (typeof body.isCollect !== 'boolean') {
      return NextResponse.json({
        code: 400,
        data: null,
        message: 'isCollect 必须为布尔值',
      });
    }

    const existing = await collection.findOne({ _id: id });

    if (!existing) {
      return NextResponse.json({
        code: 404,
        data: null,
        message: '未找到对应的知识库',
      });
    }

    const nextRepoDetail: RepoDetailType = {
      ...existing,
      isCollect: body.isCollect,
    };

    await collection.updateOne({ _id: id }, { $set: { isCollect: body.isCollect } });

    return NextResponse.json({
      code: 200,
      data: nextRepoDetail,
      message: '收藏状态更新成功',
    });
  } catch (error) {
    return NextResponse.json({ code: 500, data: error, message: 'error' });
  }
}
