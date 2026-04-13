import clientPromise from '@/lib/mongodb';
import { Repository, RepositorySchema } from '@/models/docs';

const DB_NAME = 'repository'; // 新数据库名称
const REPO_COLLECTION = 'repo_list';
export async function seedRepositories() {
  const client = await clientPromise;
  const db = client.db(DB_NAME);
  const collection = db.collection<Repository>(REPO_COLLECTION);

  // 模拟数据：手动指定几个固定的文档 ID，方便第二个脚本对应添加详情
  const repositories = RepositorySchema.array().parse([
    {
      _id: 'R_v92kLp10',
      type: 'book',
      title: '前端架构演进史',
      creator: '张三',
      time: '2026-03-15',
      repository: '技术沉淀核心库',
      docs_list: [
        { docs_name: '第一章：从 jQuery 到 React', docs_id: 'D_m8n2v1x9y0' },
        { docs_name: '第二章：微前端架构实践', docs_id: 'D_p5r3t1z8w4' },
      ],
    },
    {
      _id: 'R_a7s8d9f0',
      type: 'design',
      title: 'UI/UX 交互规范',
      creator: '李思',
      time: '2026-04-01',
      repository: '设计系统方案',
      docs_list: [{ docs_name: '色彩系统设计指南', docs_id: 'D_q1w2e3r4t5' }],
    },
  ]);

  const ops = repositories.map((repo) => ({
    updateOne: { filter: { _id: repo._id }, update: { $set: repo }, upsert: true },
  }));

  const result = await collection.bulkWrite(ops);
  console.log(
    `✅${REPO_COLLECTION} 知识库同步成功：插入 ${result.upsertedCount} 条，更新 ${result.modifiedCount} 条`
  );
  // process.exit(0);
}

// seedRepositories().catch(console.error);
