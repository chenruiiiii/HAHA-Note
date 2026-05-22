import clientPromise from '@/lib/mongodb';
import { DocumentDetail } from '@/models/docs';
import { NextResponse } from 'next/server';

/**
 * 获取指定文档详情。
 *
 * @param _request - 请求对象，当前接口未读取请求内容。
 * @param context - Next.js 路由上下文，`params.docsId` 为文档 ID。
 * @returns 文档详情 JSON 响应；文档不存在时返回 404。
 */
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

/**
 * 创建或更新指定文档详情。
 *
 * @param request - 请求对象，JSON body 可包含标题、HTML 内容、知识库 ID、作者和摘要。
 * @param context - Next.js 路由上下文，`params.docsId` 为文档 ID。
 * @returns 创建或保存后的文档详情 JSON 响应；缺少必要字段或保存失败时返回错误信息。
 */
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
      summary?: string;
    };

    const existing = await collection.findOne({ _id: docsId });
    const requestRepositoryId = body.repository_id?.trim();

    if (!existing) {
      if (!requestRepositoryId) {
        return NextResponse.json({
          code: 400,
          data: null,
          message: '新建文档时 repository_id 不能为空',
        });
      }

      const nextDoc: DocumentDetail = {
        _id: docsId,
        repository_id: requestRepositoryId,
        title: body.title?.trim() || '新建文档',
        content_html: body.content_html ?? '',
        summary: body.summary?.trim() || '',
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

    if (requestRepositoryId && existing.repository_id !== requestRepositoryId) {
      return NextResponse.json(
        {
          code: 409,
          data: existing,
          message: '文档所属知识库不匹配，请刷新目录后重试',
        },
        { status: 409 }
      );
    }

    const nextDoc: DocumentDetail = {
      ...existing,
      title: body.title?.trim() || existing.title,
      content_html: body.content_html ?? existing.content_html,
      summary: body.summary ?? existing.summary ?? '',
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
