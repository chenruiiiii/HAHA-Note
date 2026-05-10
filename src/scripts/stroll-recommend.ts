import clientPromise from '../lib/mongodb';
import { recommendDetailListModelSchema } from '../models/stroll-recommend';
import type { RecommendDetailType } from '../components/layout/Stroll/types/recommend';
import type { AnyBulkWriteOperation } from 'mongodb';

const DATABASE_NAME = 'stroll-recommend';
const COLLECTION_NAME = 'recommend_details';
const STROLL_COUNT = 200;
const STROLL_ID_OFFSET = 1000;

const baseTemplates = [
  {
    source: {
      platform: 'yuque' as const,
      title: '语雀专业会员支持试用MCP',
      avatar: 'https://api.dicebear.com/7.x/shapes/svg?seed=yuque',
    },
    author: {
      name: '语雀官方',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=yuque-official',
    },
    title_html: '语雀专业会员支持试用MCP',
    description_html:
      '语雀 API Token 功能向<strong>专业会员</strong>开放，可直接连接 AI 助手与知识库自动化流程。',
    content_html:
      '<h2>功能概览</h2><p>支持 Token 调用、知识检索与内容自动同步，适合团队知识库联动 AI 工作流。</p>',
    quality_level: 'featured' as const,
    like_count: 53,
    comment_count: 13,
    word_count: 389,
    source_url: 'https://www.yuque.com/haha-note/api-token',
  },
  {
    source: {
      platform: 'community' as const,
      title: 'Next.js 16 Server Actions 升级解析',
      avatar: 'https://api.dicebear.com/7.x/shapes/svg?seed=nextjs',
    },
    author: {
      name: '前端小课',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=frontend',
    },
    title_html: 'Next.js 16 Server Actions 升级解析',
    description_html:
      '从缓存边界到表单提交，梳理 <strong>Server Actions</strong> 在真实业务中的迁移路径。',
    content_html:
      '<h2>升级建议</h2><p>优先识别服务端提交链路，再逐步替换传统 API Form 方案，能明显降低状态维护成本。</p>',
    quality_level: 'normal' as const,
    like_count: 24,
    comment_count: 5,
    word_count: 512,
    source_url: 'https://nextjs.org',
  },
  {
    source: {
      platform: 'community' as const,
      title: 'TypeScript 类型体操最佳实践',
      avatar: 'https://api.dicebear.com/7.x/shapes/svg?seed=typescript',
    },
    author: {
      name: '类型体操员',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=ts-dev',
    },
    title_html: 'TypeScript 类型体操最佳实践',
    description_html: '围绕条件类型、推断与泛型约束，总结团队里最常见的抽象误区与修正方式。',
    content_html:
      '<h2>核心观点</h2><p>类型体操的目标不是炫技，而是让接口边界更稳定、调用提示更明确。</p>',
    quality_level: 'featured' as const,
    like_count: 87,
    comment_count: 17,
    word_count: 960,
    source_url: 'https://typescriptlang.org',
  },
  {
    source: {
      platform: 'community' as const,
      title: 'AI 时代的前端工程效率',
      avatar: 'https://api.dicebear.com/7.x/shapes/svg?seed=ai',
    },
    author: {
      name: '提示词黑客',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=prompt',
    },
    title_html: 'AI 时代的前端工程效率',
    description_html: '从代码生成、测试辅助到知识沉淀，分析 AI 工具真正能提升交付效率的几个节点。',
    content_html:
      '<h2>实践结论</h2><p>真正的提效来自把 AI 接进规范流程，而不是单次问答本身。</p>',
    quality_level: 'normal' as const,
    like_count: 119,
    comment_count: 22,
    word_count: 1180,
    source_url: 'https://openai.com',
  },
  {
    source: {
      platform: 'community' as const,
      title: '设计系统如何支撑多端协作',
      avatar: 'https://api.dicebear.com/7.x/shapes/svg?seed=design-system',
    },
    author: {
      name: '设计日记',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=design',
    },
    title_html: '设计系统如何支撑多端协作',
    description_html: '从变量命名、组件规范到发布流程，拆解一套能真正落地的跨团队设计系统。',
    content_html:
      '<h2>落地方式</h2><p>先统一语义层，再推进组件层，最后接入发布和校验流程，演进会更平滑。</p>',
    quality_level: 'normal' as const,
    like_count: 61,
    comment_count: 9,
    word_count: 740,
    source_url: 'https://figma.com',
  },
];

function buildRecommendSeedData(count: number) {
  return recommendDetailListModelSchema.parse(
    Array.from({ length: count }).map((_, index) => {
      const template = baseTemplates[index % baseTemplates.length];
      const serial = index + 1;
      const idSerial = STROLL_ID_OFFSET + serial;

      return {
        _id: `stroll_${String(serial).padStart(4, '0')}`,
        id: String(idSerial),
        source: template.source,
        author: template.author,
        title_html: `${template.title_html} #${serial}`,
        description_html: `${template.description_html} 第 ${serial} 篇内容用于虚拟滚动压力测试。`,
        content_html: `${template.content_html}<p>测试序号：${serial}。这一条用于验证 HAVirtualScroll 在长列表场景下的窗口计算与恒定 DOM 数表现。</p>`,
        quality_level: serial % 3 === 0 ? 'featured' : template.quality_level,
        like_count: template.like_count + serial,
        comment_count: template.comment_count + (serial % 15),
        word_count: template.word_count + serial * 3,
        source_url: template.source_url,
      };
    })
  );
}

export async function seedStrollRecommend() {
  const client = await clientPromise;
  const db = client.db(DATABASE_NAME);
  const collection = db.collection<RecommendDetailType>(COLLECTION_NAME);
  const recommendSeedData = buildRecommendSeedData(STROLL_COUNT);

  await collection.createIndex({ id: 1 }, { unique: true });

  const operations: AnyBulkWriteOperation<RecommendDetailType>[] = recommendSeedData.map((item) => ({
    updateOne: {
      filter: { _id: item._id },
      update: {
        $set: item,
      },
      upsert: true,
    },
  }));

  const result = await collection.bulkWrite(operations, { ordered: false });

  console.log(
    `[stroll-recommend] seeded ${recommendSeedData.length} docs into ${DATABASE_NAME}.${COLLECTION_NAME}`
  );
  console.log(
    `[stroll-recommend] inserted=${result.upsertedCount}, modified=${result.modifiedCount}, matched=${result.matchedCount}`
  );
}
