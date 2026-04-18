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
    };

    if (!body.title?.trim()) {
      return NextResponse.json({
        code: 400,
        data: null,
        message: '标题不能为空',
      });
    }

    if (!body.content_html?.trim()) {
      return NextResponse.json({
        code: 400,
        data: null,
        message: '内容不能为空',
      });
    }

    const existing = await collection.findOne({ _id: docsId });

    if (!existing) {
      return NextResponse.json({
        code: 404,
        data: null,
        message: '未找到对应文档',
      });
    }

    const nextDoc: DocumentDetail = {
      ...existing,
      title: body.title.trim(),
      content_html: body.content_html,
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
