import clientPromise from '@/lib/mongodb';
import { AiMissionDetailSchema, ListItemSchema, type AiMissionDetail, type ListItem } from '@/models/ai-mission';

const DB_NAME = 'ai-chat';
const RECENT_COLLECTION = '最近任务';
const FAVORITE_COLLECTION = '收藏任务';
const DETAIL_COLLECTION = 'ai_mission_detail';

const recentTitles = [
  '帮我整理这周的需求排期',
  '写一版项目周报并突出风险项',
  '把 React 性能优化方案列成清单',
  '生成一次用户访谈问题提纲',
  '梳理知识库首页信息架构',
  '输出一份前端埋点设计文档',
  '把会议纪要整理成待办列表',
  '给登录页写一个改版方案',
  '分析一下最近的报错日志',
  '总结 TypeScript 泛型常见误区',
  '写一个接口联调 Checklist',
  '产出移动端适配验收项',
  '给新同学做一份项目 onboarding',
  '规划 AI 对话页面的数据结构',
  '整理今天的开发任务优先级',
];

const favoriteTitles = [
  '收藏的高质量 Prompt 模板',
  '收藏的产品需求评审模板',
  '收藏的周会汇报结构',
  '收藏的设计走查清单',
  '收藏的 Next.js 部署笔记',
  '收藏的 MongoDB 查询技巧',
  '收藏的前端错误排查手册',
  '收藏的可视化配色方案',
  '收藏的用户增长分析方法',
  '收藏的 Markdown 写作范式',
  '收藏的组件命名规范',
  '收藏的代码 Review 清单',
  '收藏的接口状态码约定',
  '收藏的性能监控指标说明',
  '收藏的需求拆解模板',
];

function buildList(prefix: 'RECENT' | 'FAVORITE', titles: string[]): ListItem[] {
  return ListItemSchema.array().parse(
    titles.map((title, index) => ({
      _id: `AIM_${prefix}_${String(index + 1).padStart(2, '0')}`,
      title,
    }))
  );
}

function buildDetail(item: ListItem, category: 'recent' | 'favorite', index: number): AiMissionDetail {
  const createdAt = `2026-04-${String((index % 9) + 10).padStart(2, '0')} 10:${String(
    (index * 3) % 60
  ).padStart(2, '0')}`;
  const updatedAt = `2026-04-${String((index % 9) + 11).padStart(2, '0')} 19:${String(
    (index * 7) % 60
  ).padStart(2, '0')}`;
  const coverSeed = `${category}-${index + 1}`;
  const focus = category === 'recent' ? '执行优先级和可落地步骤' : '沉淀复用方式和长期价值';

  return AiMissionDetailSchema.parse({
    _id: item._id,
    title: item.title,
    category,
    created_at: createdAt,
    updated_at: updatedAt,
    types: [
      {
        id: `${item._id}_user_01`,
        role: 'user',
        parts: [
          {
            type: 'text',
            text: `${item.title}，请结合当前项目背景帮我整理一版可直接执行的内容。`,
          },
        ],
      },
      {
        id: `${item._id}_assistant_01`,
        role: 'assistant',
        parts: [
          {
            type: 'markdown',
            markdown: `## 任务目标\n\n围绕“${item.title}”输出一份更清晰的执行结果，重点关注${focus}。\n\n## 建议拆分\n\n1. 明确输入资料和边界\n2. 列出最小可交付版本\n3. 补充风险与兜底方案\n\n> 这条数据用于验证 AIChat 中的 markdown 渲染能力。`,
          },
        ],
      },
      {
        id: `${item._id}_assistant_02`,
        role: 'assistant',
        parts: [
          {
            type: 'image_url',
            image_url: {
              url: `https://picsum.photos/seed/${coverSeed}/960/540`,
              alt: `${item.title} 配图`,
              width: 960,
              height: 540,
            },
          },
        ],
      },
      {
        id: `${item._id}_assistant_03`,
        role: 'assistant',
        parts: [
          {
            type: 'text',
            text: `补充说明：如果你要把这条任务接到真实页面，可以直接使用当前 _id=${item._id} 去 ai_mission_detail 集合查询详情。`,
          },
        ],
      },
    ],
  });
}

async function upsertListCollection(collectionName: string, data: ListItem[]) {
  const client = await clientPromise;
  const db = client.db(DB_NAME);
  const collection = db.collection<ListItem>(collectionName);

  const ops = data.map((item) => ({
    updateOne: {
      filter: { _id: item._id },
      update: { $set: item },
      upsert: true,
    },
  }));

  return collection.bulkWrite(ops);
}

async function upsertDetails(data: AiMissionDetail[]) {
  const client = await clientPromise;
  const db = client.db(DB_NAME);
  const collection = db.collection<AiMissionDetail>(DETAIL_COLLECTION);

  const ops = data.map((item) => ({
    updateOne: {
      filter: { _id: item._id },
      update: { $set: item },
      upsert: true,
    },
  }));

  return collection.bulkWrite(ops);
}

export async function seedAiChat() {
  const recentList = buildList('RECENT', recentTitles);
  const favoriteList = buildList('FAVORITE', favoriteTitles);
  const detailList = [
    ...recentList.map((item, index) => buildDetail(item, 'recent', index)),
    ...favoriteList.map((item, index) => buildDetail(item, 'favorite', index)),
  ];

  const recentResult = await upsertListCollection(RECENT_COLLECTION, recentList);
  const favoriteResult = await upsertListCollection(FAVORITE_COLLECTION, favoriteList);
  const detailResult = await upsertDetails(detailList);

  console.log(
    `✅ [${DB_NAME}.${RECENT_COLLECTION}] 同步成功：插入 ${recentResult.upsertedCount} 条，更新 ${recentResult.modifiedCount} 条`
  );
  console.log(
    `✅ [${DB_NAME}.${FAVORITE_COLLECTION}] 同步成功：插入 ${favoriteResult.upsertedCount} 条，更新 ${favoriteResult.modifiedCount} 条`
  );
  console.log(
    `✅ [${DB_NAME}.${DETAIL_COLLECTION}] 同步成功：插入 ${detailResult.upsertedCount} 条，更新 ${detailResult.modifiedCount} 条`
  );
  console.log('最近任务 IDs:', recentList.map((item) => item._id).join(', '));
  console.log('收藏任务 IDs:', favoriteList.map((item) => item._id).join(', '));
}
