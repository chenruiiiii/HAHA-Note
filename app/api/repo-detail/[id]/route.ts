import { RepoDetailType } from '@/components/layout/Repository/types';
import clientPromise from '@/lib/mongodb';
import { NextResponse } from 'next/server';
import { isPrismaBackend } from '@/server/auth/backend';
import { requireUser } from '@/server/dal/require-user';
import { findRepositoryById, toggleRepositoryFavorite } from '@/server/dal/repositories';
import { dalErrorResponse, privateJson } from '@/server/http/private-json';

/**
 * 获取指定知识库详情。
 *
 * Prisma 模式下仅限拥有者或成员可见；Mongo 模式保留历史行为。
 *
 * @param _request - 请求对象，用于解析当前登录用户。
 * @param context - Next.js 路由上下文，`params.id` 为知识库 ID。
 * @returns 知识库详情 JSON 响应；ID 为空或知识库不存在时返回错误信息。
 */
export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
): Promise<Response> {
  const { id } = await context.params;
  if (!id) {
    return NextResponse.json({ code: 400, message: 'ID 不能为空' });
  }

  if (isPrismaBackend()) {
    try {
      const user = await requireUser(_request);
      const data = await findRepositoryById(id, user.userId);

      if (!data) {
        return privateJson({
          code: 404,
          data: null,
          message: '未找到对应的知识库',
        }, { status: 404 });
      }

      return privateJson({ code: 200, data: data as unknown as RepoDetailType, message: 'success' });
    } catch (error) {
      const response = dalErrorResponse(error);
      return response ?? privateJson({ code: 500, data: null, message: 'error' }, { status: 500 });
    }
  }

  const client = await clientPromise;
  const db = client.db('repository');
  const collection = db.collection<RepoDetailType>('repo_list');

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
 *
 * @param request - 请求对象，JSON body 需包含布尔值 `isCollect`。
 * @param context - Next.js 路由上下文，`params.id` 为知识库 ID。
 * @returns 更新后的知识库详情 JSON 响应；ID 为空、参数非法或知识库不存在时返回错误信息。
 */
export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
): Promise<Response> {
  const { id } = await context.params;

  if (!id) {
    return NextResponse.json({ code: 400, data: null, message: 'ID 不能为空' });
  }

  if (isPrismaBackend()) {
    try {
      const body = (await request.json()) as { isCollect?: boolean };

      if (typeof body.isCollect !== 'boolean') {
        return privateJson({
          code: 400,
          data: null,
          message: 'isCollect 必须为布尔值',
        });
      }

      const user = await requireUser(request);
      const data = await toggleRepositoryFavorite(id, user.userId, body.isCollect);

      if (!data) {
        return privateJson({
          code: 404,
          data: null,
          message: '未找到对应的知识库',
        }, { status: 404 });
      }

      return privateJson({
        code: 200,
        data: data as unknown as RepoDetailType,
        message: '收藏状态更新成功',
      });
    } catch (error) {
      const response = dalErrorResponse(error);
      return response ?? privateJson({ code: 500, data: null, message: 'error' }, { status: 500 });
    }
  }

  const client = await clientPromise;
  const db = client.db('repository');
  const collection = db.collection<RepoDetailType>('repo_list');

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
