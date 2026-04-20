import clientPromise from '@/lib/mongodb';
import { DocumentDetail } from '@/models/docs';
import { NextResponse } from 'next/server';

export async function GET(
  _request: Request,
  context: { params: Promise<{ docsId: string }> }
): Promise<Response> {
  const client = await clientPromise;
  const db = client.db('repository');
  const collection = db.collection<DocumentDetail>('docs_detail');
  const { docsId } = await context.params;

  try {
    const data = await collection.findOne({ _id: docsId });

    if (!data) {
      return NextResponse.json({
        code: 404,
        data: null,
        message: '未找到对应文档',
      });
    }

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

export async function POST(
  request: Request,
  context: { params: Promise<{ docsId: string }> }
): Promise<Response> {
  const client = await clientPromise;
  const db = client.db('repository');
  const collection = db.collection<DocumentDetail>('docs_detail');
  const { docsId } = await context.params;

  try {
    const body = (await request.json()) as {
      title?: string;
      content_html?: string;
      repository_id?: string;
      author?: string;
    };

    const existing = await collection.findOne({ _id: docsId });

    if (!existing) {
      if (!body.repository_id?.trim()) {
        return NextResponse.json({
          code: 400,
          data: null,
          message: '新建文档时 repository_id 不能为空',
        });
      }

      const nextDoc: DocumentDetail = {
        _id: docsId,
        repository_id: body.repository_id.trim(),
        title: body.title?.trim() || '新建文档',
        content_html: body.content_html ?? '',
        author: body.author?.trim() || '当前用户',
        updated_at: new Date().toISOString(),
      };

      await collection.insertOne(nextDoc);

      return NextResponse.json({
        code: 200,
        data: nextDoc,
        message: '创建成功',
      });
    }

    const nextDoc: DocumentDetail = {
      ...existing,
      title: body.title?.trim() || existing.title,
      content_html: body.content_html ?? existing.content_html,
      updated_at: new Date().toISOString(),
    };

    await collection.updateOne({ _id: docsId }, { $set: nextDoc });

    return NextResponse.json({
      code: 200,
      data: nextDoc,
      message: '保存成功',
    });
  } catch (error) {
    return NextResponse.json({
      code: 500,
      data: error,
      message: 'error',
    });
  }
}
