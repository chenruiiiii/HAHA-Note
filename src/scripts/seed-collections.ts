import { Collection } from '@/components/layout/Start/types/list';
import clientPromise from '@/lib/mongodb';
import { nanoid } from 'nanoid';
import { z } from 'zod';
// 导入接口

const DB_NAME = 'user_activity';
const COLLECTION_NAME = 'favorite_repos';

// 设计 Schema
const CollectionSchema = z.object({
  _id: z.string(),
  type: z.string(),
  title: z.string(),
  creator: z.string(),
  time: z.string(),
  repository: z.string(),
  repository_id: z.string(),
  docs_list: z.array(
    z.object({
      docs_name: z.string(),
      docs_id: z.string(),
    })
  ),
});

export async function seedFavoriteCollections() {
  const client = await clientPromise;
  const db = client.db(DB_NAME);
  const collection = db.collection<Collection>(COLLECTION_NAME);

  // 模拟 8 条收藏数据
  const favoriteData = Array.from({ length: 8 }).map((_, i) => ({
    _id: `COL_${nanoid(10)}`,
    type: i % 2 === 0 ? 'book' : 'resource',
    title: i % 2 === 0 ? `收藏的精品书刊 ${i + 1}` : `必备资源包 ${i + 1}`,
    creator: i % 3 === 0 ? '架构师老王' : '前端小陈',
    time: '2026-04-13',
    repository: i % 2 === 0 ? '技术沉淀库' : '公共资源库',
    repository_id: `R_${nanoid(8)}`,
    docs_list: [
      { docs_name: '快速上手指南', docs_id: `D_${nanoid(12)}` },
      { docs_name: '进阶实战案例', docs_id: `D_${nanoid(12)}` },
    ],
  }));

  // 校验数据
  const validatedData = CollectionSchema.array().parse(favoriteData);

  const ops = validatedData.map((item) => ({
    updateOne: { filter: { _id: item._id }, update: { $set: item }, upsert: true },
  }));

  const result = await collection.bulkWrite(ops as any);
  console.log(
    `✅ [${DB_NAME}] 收藏知识库同步成功：插入 ${result.upsertedCount} 条，更新 ${result.modifiedCount} 条`
  );
}
