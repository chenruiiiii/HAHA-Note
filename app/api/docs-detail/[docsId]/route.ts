import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireUser } from '@/server/dal/require-user';
import {
  createDocument,
  saveDocument,
} from '@/server/dal/document-save';
import { getDocument } from '@/server/dal/document-read';
import { htmlToTipTapJson } from '@/server/lib/content-html';
import { isPrismaBackend } from '@/server/auth/backend';
import clientPromise from '@/lib/mongodb';
import { DocumentDetail } from '@/models/docs';
import type { JSONContent } from '@tiptap/react';

/** 版本化保存契约（新）：必须携带 baseVersion 与结构化 content。 */
const versionedSaveSchema = z.object({
  baseVersion: z.number().int().nonnegative(),
  content: z.unknown(),
  title: z.string().max(200).optional(),
  summary: z.string().max(2000).optional(),
  createRevision: z.boolean().optional(),
  requestId: z.string().max(120).optional(),
});

/** legacy 兼容保存契约：content_html，无 baseVersion。 */
const legacySaveSchema = z.object({
  baseVersion: z.undefined().optional(),
  content_html: z.string(),
  title: z.string().max(200).optional(),
  repository_id: z.string().optional(),
  author: z.string().optional(),
  summary: z.string().max(2000).optional(),
});

const saveBodySchema = z.union([versionedSaveSchema, legacySaveSchema]);

const PRIVATE_NO_STORE_HEADERS = {
  'Cache-Control': 'private, no-store',
  Pragma: 'no-cache',
} as const;

function noStoreError(status: number, code: number, message: string) {
  return NextResponse.json({ code, data: null, message }, {
    status,
    headers: PRIVATE_NO_STORE_HEADERS,
  });
}

/**
 * 获取指定文档详情。
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ docsId: string }> }
): Promise<Response> {
  const { docsId } = await context.params;

  if (isPrismaBackend()) {
    try {
      const user = await requireUser(request);
      const result = await getDocument(docsId, user.userId);

      if (!result.ok) {
        if (result.code === 'NOT_FOUND') {
          return noStoreError(404, 404, '未找到对应文档');
        }
        return noStoreError(403, 403, '暂无权限访问该文档');
      }

      return NextResponse.json(
        { code: 200, data: result.document, message: 'success' },
        { headers: PRIVATE_NO_STORE_HEADERS }
      );
    } catch {
      return noStoreError(401, 401, '未登录或登录已过期');
    }
  }

  // legacy MongoDB 后端
  const client = await clientPromise;
  const db = client.db('repository');
  const collection = db.collection<DocumentDetail>('docs_detail');

  try {
    const data = await collection.findOne({ _id: docsId });

    if (!data) {
      return noStoreError(404, 404, '未找到对应文档');
    }

    return NextResponse.json({ code: 200, data, message: 'success' });
  } catch {
    return noStoreError(500, 500, '服务器内部错误');
  }
}

/**
 * 创建或保存指定文档详情。Prisma 后端下支持版本化契约与 legacy 兼容契约。
 */
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ docsId: string }> }
): Promise<Response> {
  const { docsId } = await context.params;

  if (isPrismaBackend()) {
    let user;
    try {
      user = await requireUser(request);
    } catch {
      return noStoreError(401, 401, '未登录或登录已过期');
    }

    let rawBody: unknown;
    try {
      rawBody = await request.json();
    } catch {
      return noStoreError(422, 422, '请求体不是合法的 JSON');
    }

    const parsed = saveBodySchema.safeParse(rawBody);
    if (!parsed.success) {
      return noStoreError(422, 422, '请求参数不合法');
    }
    const body = parsed.data;

    try {
      // 新契约：版本化保存
      if ('baseVersion' in body && typeof body.baseVersion === 'number') {
        const result = await saveDocument({
          documentId: docsId,
          userId: user.userId,
          baseVersion: body.baseVersion,
          title: body.title,
          content: body.content as JSONContent,
          summary: body.summary,
          createRevision: body.createRevision,
          requestId: body.requestId,
        });

        if (!result.ok) {
          if (result.code === 'NOT_FOUND') {
            return noStoreError(404, 404, '未找到对应文档');
          }
          if (result.code === 'FORBIDDEN') {
            return noStoreError(403, 403, '暂无权限保存该文档');
          }
          if (result.code === 'VERSION_CONFLICT') {
            return NextResponse.json(
              {
                code: 'VERSION_CONFLICT',
                data: null,
                currentVersion: result.currentVersion,
                message: '文档已被他人更新，请刷新后合并',
              },
              { status: 409, headers: PRIVATE_NO_STORE_HEADERS }
            );
          }
          return noStoreError(500, 500, '服务器内部错误');
        }

        return NextResponse.json(
          { code: 200, data: result.document, message: '保存成功' },
          { headers: PRIVATE_NO_STORE_HEADERS }
        );
      }

      // legacy 契约：content_html 消毒 + 转 TipTap JSON
      const cleanHtml = body.content_html;
      const content = htmlToTipTapJson(cleanHtml);

      // 文档不存在时按新建处理
      const existing = await getDocument(docsId, user.userId);

      if (!existing.ok && existing.code === 'NOT_FOUND') {
        if (!body.repository_id) {
          return noStoreError(400, 400, '新建文档时 repository_id 不能为空');
        }
        const created = await createDocument({
          documentId: docsId,
          repositoryId: body.repository_id,
          userId: user.userId,
          title: body.title,
          content,
          contentHtml: cleanHtml,
          summary: body.summary,
        });

        if (!created.ok) {
          if (created.code === 'FORBIDDEN') {
            return noStoreError(403, 403, '暂无权限在该知识库创建文档');
          }
          return noStoreError(404, 404, '未找到对应的知识库');
        }

        return NextResponse.json(
          { code: 200, data: { ...created.document, legacy: true }, message: '创建成功' },
          { headers: PRIVATE_NO_STORE_HEADERS }
        );
      }

      if (!existing.ok) {
        return noStoreError(403, 403, '暂无权限保存该文档');
      }

      // legacy 更新：以当前版本为 base 做版本化保存
      const saved = await saveDocument({
        documentId: docsId,
        userId: user.userId,
        baseVersion: existing.document.version,
        title: body.title,
        content,
        summary: body.summary,
      });

      if (!saved.ok) {
        if (saved.code === 'VERSION_CONFLICT') {
          return NextResponse.json(
            {
              code: 'VERSION_CONFLICT',
              data: null,
              currentVersion: saved.currentVersion,
              message: '文档已被他人更新，请刷新后合并',
            },
            { status: 409, headers: PRIVATE_NO_STORE_HEADERS }
          );
        }
        return noStoreError(500, 500, '服务器内部错误');
      }

      return NextResponse.json(
        { code: 200, data: { ...saved.document, legacy: true }, message: '保存成功' },
        { headers: PRIVATE_NO_STORE_HEADERS }
      );
    } catch {
      // 不泄露数据库异常、连接串或正文
      return noStoreError(500, 500, '服务器内部错误');
    }
  }

  // legacy MongoDB 后端（保留原逻辑）
  const client = await clientPromise;
  const db = client.db('repository');
  const collection = db.collection<DocumentDetail>('docs_detail');

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
        return noStoreError(400, 400, '新建文档时 repository_id 不能为空');
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

      return NextResponse.json({ code: 200, data: nextDoc, message: '创建成功' });
    }

    if (requestRepositoryId && existing.repository_id !== requestRepositoryId) {
      return NextResponse.json(
        { code: 409, data: existing, message: '文档所属知识库不匹配，请刷新目录后重试' },
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

    return NextResponse.json({ code: 200, data: nextDoc, message: '保存成功' });
  } catch {
    return noStoreError(500, 500, '服务器内部错误');
  }
}
