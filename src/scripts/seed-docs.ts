import clientPromise from '@/lib/mongodb';
import { DocumentDetail, DocumentDetailSchema, Repository } from '@/models/docs';

const DB_NAME = 'repository'; // 新数据库名称
const DOCS_COLLECTION = 'docs_detail';

export async function seedDocuments() {
  const client = await clientPromise;
  const db = client.db(DB_NAME);
  const collection = db.collection<DocumentDetail>(DOCS_COLLECTION);

  const documents = DocumentDetailSchema.array().parse([
    {
      _id: 'D_m8n2v1x9y0',
      repository_id: 'R_v92kLp10',
      title: '第一章：从 jQuery 到 React',
      content_html: '<p>这里是详细的演进历史内容...</p>',
      author: '张三',
      updated_at: '2026-03-16',
    },
    {
      _id: 'D_p5r3t1z8w4',
      repository_id: 'R_v92kLp10',
      title: '第二章：微前端架构实践',
      content_html: '<p>微前端深度解析内容...</p>',
      author: '张三',
      updated_at: '2026-03-18',
    },
    {
      _id: 'D_q1w2e3r4t5',
      repository_id: 'R_a7s8d9f0',
      title: '色彩系统设计指南',
      content_html: '<h2>语义化色彩</h2><p>规范说明...</p>',
      author: '李思',
      updated_at: '2026-04-02',
    },
  ]);

  const ops = documents.map((doc) => ({
    updateOne: { filter: { _id: doc._id }, update: { $set: doc }, upsert: true },
  }));

  const result = await collection.bulkWrite(ops);
  console.log(
    `✅ ${DOCS_COLLECTION}文档详情同步成功：插入 ${result.upsertedCount} 条，更新 ${result.modifiedCount} 条`
  );
  process.exit(0);
}

// seedDocuments().catch(console.error);
