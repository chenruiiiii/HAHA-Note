import clientPromise from '@/lib/mongodb';
import { Repository, RepositorySchema } from '@/models/docs';

const DB_NAME = 'repository';
const REPO_COLLECTION = 'repo_list';

export async function seedRepositories() {
  const client = await clientPromise;
  const db = client.db(DB_NAME);
  const collection = db.collection<Repository>(REPO_COLLECTION);

  const repositories = RepositorySchema.array().parse([
    {
      _id: 'R_v92kLp10',
      isPublic: true,
      description: '收录前端工程化、架构设计与协作规范的核心知识沉淀。',
      update_time: '2026-04-20 09:30',
      creator: '张三',
      avatar: ['https://avatars.githubusercontent.com/u/1024025?v=4'],
      docs_list: [
        { docs_id: 'D_m8n2v1x9y0', docs_name: '第一章：从 jQuery 到 React' },
        { docs_id: 'D_p5r3t1z8w4', docs_name: '第二章：微前端架构实践' },
        { docs_id: 'D_f7h6j5k4l3', docs_name: '第三章：组件库治理策略' },
      ],
      title: '前端架构演进史',
      repo_desc: '从项目起步到体系化治理，系统记录前端架构演进过程。',
      type: 'book',
      isCollect: true,
    },
    {
      _id: 'R_a7s8d9f0',
      isPublic: false,
      description: '聚焦设计规范、组件体验和视觉系统统一的团队资料库。',
      update_time: '2026-04-18 14:10',
      creator: '李思',
      avatar: ['https://avatars.githubusercontent.com/u/583231?v=4'],
      docs_list: [
        { docs_id: 'D_q1w2e3r4t5', docs_name: '色彩系统设计指南' },
        { docs_id: 'D_u7i8o9p0a1', docs_name: '组件间距与栅格规范' },
      ],
      title: 'UI/UX 交互规范',
      repo_desc: '整理交互细节、界面规范与体验标准，便于设计协同落地。',
      type: 'design',
      isCollect: false,
    },
    {
      _id: 'R_z4x5c6v7',
      isPublic: true,
      description: '围绕 AI 写作、提示词工程和自动化协作的实验知识库。',
      update_time: '2026-04-19 20:15',
      creator: '王五',
      avatar: ['https://avatars.githubusercontent.com/u/810438?v=4'],
      docs_list: [
        { docs_id: 'D_b2n3m4q5w6', docs_name: 'Prompt 模板设计方法' },
        { docs_id: 'D_c7v8b9n0m1', docs_name: '多角色工作流拆解' },
        { docs_id: 'D_l2k3j4h5g6', docs_name: 'AI 写作提效 SOP' },
      ],
      title: 'AI 内容工作台',
      repo_desc: '沉淀 AI 内容生产、知识整理和工作流优化的实践方法。',
      type: 'ai',
      isCollect: true,
    },
  ]);

  const ops = repositories.map((repo) => ({
    updateOne: { filter: { _id: repo._id }, update: { $set: repo }, upsert: true },
  }));

  const result = await collection.bulkWrite(ops);
  console.log(
    `✅${REPO_COLLECTION} 知识库同步成功：插入 ${result.upsertedCount} 条，更新 ${result.modifiedCount} 条`
  );
}
