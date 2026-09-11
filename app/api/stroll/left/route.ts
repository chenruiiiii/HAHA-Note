import { NextResponse } from 'next/server';
import { isPrismaBackend } from '@/server/auth/backend';
import { listExploreArticles } from '@/server/dal/explore';
import { dalErrorResponse, privateJson } from '@/server/http/private-json';
import type { RecommendDetailType } from '@/components/layout/Stroll/types/recommend';

/**
 * 获取逛逛推荐列表。
 *
 * Prisma 模式读取 ExploreArticle（公开内容，不要求登录）；Mongo 模式保留历史行为。
 *
 * @returns 逛逛推荐详情列表 JSON 响应；查询失败时返回错误信息。
 */
export async function GET() {
  if (isPrismaBackend()) {
    try {
      const data = await listExploreArticles(100);

      return privateJson({ code: 200, data: data as unknown as RecommendDetailType[], message: 'success' });
    } catch (error) {
      const response = dalErrorResponse(error);
      return response ?? privateJson({ code: 500, data: null, message: 'error' }, { status: 500 });
    }
  }

  const { default: clientPromise } = await import('@/lib/mongodb');
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
