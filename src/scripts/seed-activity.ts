import clientPromise from '@/lib/mongodb';
import { nanoid } from 'nanoid';
import { z } from 'zod';
// 导入你的 Interface (这里假设你已经定义了对应的 Schema，如果没有，我们直接在此处定义校验)
import { EditDocument, BrowseDocument } from '@/components/layout/Start/types/list';
const DB_NAME = 'user_activity';

// 定义 Zod Schema 以确保数据合规
const ActivitySchema = z.object({
  _id: z.string(),
  repository_id: z.string(),
  title: z.string(),
  author: z.string(),
  repository_name: z.string(),
  updated_time: z.string(),
});

// 模拟数据生成器
const generateData = (count: number, prefix: string) => {
  return Array.from({ length: count }).map((_, i) => ({
    _id: `${prefix}_${nanoid(10)}`,
    repository_id: `R_${nanoid(8)}`,
    title: `${prefix === 'EDIT' ? '修改了' : '阅读了'}文档: 深度探索项目-${i + 1}`,
    author: '张三',
    repository_name: i % 2 === 0 ? '技术沉淀核心库' : '设计系统方案',
    updated_time: new Date().toISOString(),
  }));
};

// 填充编辑历史
export async function seedEditHistory() {
  const client = await clientPromise;
  const db = client.db(DB_NAME);
  const collection = db.collection<EditDocument>('edit_history');

  const data = ActivitySchema.array().parse(generateData(5, 'EDIT'));
  const ops = data.map((item) => ({
    updateOne: { filter: { _id: item._id }, update: { $set: item }, upsert: true },
  }));

  const result = await collection.bulkWrite(ops);
  console.log(`✅ [${DB_NAME}] 编辑历史同步成功：插入 ${result.upsertedCount} 条`);
}

// 填充浏览历史
export async function seedBrowseHistory() {
  const client = await clientPromise;
  const db = client.db(DB_NAME);
  const collection = db.collection<BrowseDocument>('browse_history');

  const data = ActivitySchema.array().parse(generateData(5, 'BROWSE'));
  const ops = data.map((item) => ({
    updateOne: { filter: { _id: item._id }, update: { $set: item }, upsert: true },
  }));

  const result = await collection.bulkWrite(ops);
  console.log(`✅ [${DB_NAME}] 浏览历史同步成功：插入 ${result.upsertedCount} 条`);
}
