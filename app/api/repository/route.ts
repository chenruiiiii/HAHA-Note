import { RepoDetailType } from '@/components/layout/Repository/types';
import { RepositorySchema } from '@/models/docs';
import { NextResponse } from 'next/server';
import { nanoid } from 'nanoid';
import { isPrismaBackend } from '@/server/auth/backend';
import { requireUser } from '@/server/dal/require-user';
import { listRepositories, createRepository } from '@/server/dal/repositories';
import { dalErrorResponse, privateJson } from '@/server/http/private-json';

/**
 * 获取知识库列表。
 *
 * Prisma 模式下仅返回当前用户拥有或参与的知识库；Mongo 模式保留历史行为。
 *
 * @param request - 请求对象，用于解析当前登录用户。
 * @returns 知识库列表 JSON 响应；查询失败时返回错误信息。
 */
export async function GET(request: Request): Promise<Response> {
  if (isPrismaBackend()) {
    try {
      const user = await requireUser(request);
      const data = await listRepositories(user.userId);
      // 兼容历史契约：列表接口返回裸数组；用 privateJson 保持与其他私有接口一致的禁缓存
      return privateJson(data);
    } catch (error) {
      const response = dalErrorResponse(error);
      return (
        response ??
        privateJson({ code: 500, data: null, message: '查询知识库失败' }, { status: 500 })
      );
    }
  }

  const { default: clientPromise } = await import('@/lib/mongodb');
  const db = clientPromise.then((client) => client.db('repository'));
  const collection = (await db).collection('repo_list');

  try {
    const data = await collection.find({}).toArray();
    return privateJson(data);
  } catch (err) {
    return NextResponse.json(err);
  }
}

/**
 * 创建新的知识库。
 *
 * @param request - 请求对象，JSON body 需包含知识库 `title`，可选 `description`。
 * @returns 新建知识库详情 JSON 响应；标题为空或创建失败时返回错误信息。
 */
export async function POST(request: Request): Promise<Response> {
  if (isPrismaBackend()) {
    try {
      const user = await requireUser(request);
      const body = (await request.json()) as {
        title?: string;
        description?: string;
      };

      if (!body.title?.trim()) {
        return privateJson({
          code: 400,
          data: null,
          message: '知识库标题不能为空',
        });
      }

      const data = await createRepository(
        {
          title: body.title.trim(),
          description: body.description?.trim() || '这个人很懒，没有写任何东西~',
        },
        user.userId
      );

      return privateJson({
        code: 200,
        data: data as unknown as RepoDetailType,
        message: '创建知识库成功',
      });
    } catch (error) {
      const response = dalErrorResponse(error);
      return (
        response ??
        privateJson({ code: 500, data: null, message: '创建知识库失败' }, { status: 500 })
      );
    }
  }

  const { default: clientPromise } = await import('@/lib/mongodb');
  const client = await clientPromise;
  const db = client.db('repository');
  const collection = db.collection<RepoDetailType>('repo_list');

  try {
    const body = (await request.json()) as {
      title?: string;
      description?: string;
    };

    if (!body.title?.trim()) {
      return NextResponse.json({
        code: 400,
        data: null,
        message: '知识库标题不能为空',
      });
    }

    const defaultDescription = body.description?.trim() || '这个人很懒，没有写任何东西~';
    const nextRepository = RepositorySchema.parse({
      _id: `R_${nanoid(8)}`,
      avatar: [`https://api.dicebear.com/9.x/adventurer/svg?seed=${nanoid(6)}`],
      creator: '王五',
      description: '这个人很懒，没有写任何东西~',
      isCollect: false,
      isPublic: true,
      repo_desc: defaultDescription,
      title: body.title.trim(),
      type: 'book',
      update_time: new Date().toISOString(),
      docs_list: [],
    });

    await collection.insertOne(nextRepository);

    return NextResponse.json({
      code: 200,
      data: nextRepository,
      message: '创建知识库成功',
    });
  } catch (err) {
    return NextResponse.json({
      code: 500,
      data: err,
      message: '创建知识库失败',
    });
  }
}
