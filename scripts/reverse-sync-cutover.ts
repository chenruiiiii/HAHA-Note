/**
 * 回滚辅助 CLI：把 cutover 时间戳之后、PostgreSQL 中发生变化的核心业务行
 * 反向同步回 MongoDB，供切回 DATA_BACKEND=mongodb 前使用。
 *
 * 用法：CUTOVER_TIMESTAMP="2026-09-09T03:00:00Z" pnpm rollback:reverse-sync
 * 依赖：APP_MONGODB_MONGODB_URI、MIGRATION_DATABASE_URL/DATABASE_URL。
 *
 * 仅同步 repositories/documents/conversations+messages/activities；users/sessions/
 * favorites/explore 不回写（见 design.md boundary 22）。
 */
import 'dotenv/config';
import { MongoClient } from 'mongodb';
import { PrismaClient } from '../src/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

// Mongo 旧集合是松散文档，写入时只要求保留 _id 为字符串
type LegacyDoc = { _id?: string } & Record<string, unknown>;

async function main() {
  const cutover = process.env.CUTOVER_TIMESTAMP;
  if (!cutover) {
    console.error('✗ 需要 CUTOVER_TIMESTAMP（ISO 时间，取反同步的起点）');
    process.exit(1);
  }
  const since = new Date(cutover);
  if (Number.isNaN(since.getTime())) {
    console.error('✗ CUTOVER_TIMESTAMP 不是合法时间');
    process.exit(1);
  }

  const mongoUri = process.env.APP_MONGODB_MONGODB_URI;
  const pgUrl = process.env.MIGRATION_DATABASE_URL || process.env.DATABASE_URL;
  if (!mongoUri || !pgUrl) {
    console.error('✗ 缺少 APP_MONGODB_MONGODB_URI 或 MIGRATION_DATABASE_URL');
    process.exit(1);
  }

  const adapter = new PrismaPg({ connectionString: pgUrl });
  const prisma = new PrismaClient({ adapter });
  const mongo = new MongoClient(mongoUri);

  try {
    await mongo.connect();
    const repoDb = mongo.db('repository');
    const chatDb = mongo.db('ai-chat');
    const activityDb = mongo.db('user_activity');

    // --- 文档：写回 docs_detail（docs_list 由知识库详情生成，不反向同步） ---
    const docs = await prisma.document.findMany({
      where: { updatedAt: { gte: since } },
      include: { repository: true },
    });
    const docsCol = repoDb.collection<LegacyDoc>('docs_detail');
    let docsSynced = 0;
    for (const doc of docs) {
      const docAny = doc as unknown as {
        id: string;
        title: string;
        contentHtml: string | null;
        summary: string;
        repositoryId: string;
        updatedAt: Date;
      };
      await docsCol.updateOne(
        { _id: docAny.id },
        {
          $set: {
            _id: docAny.id,
            repository_id: docAny.repositoryId,
            title: docAny.title,
            content_html: docAny.contentHtml ?? '',
            summary: docAny.summary,
            updated_at: docAny.updatedAt.toISOString(),
          },
        },
        { upsert: true }
      );
      docsSynced++;
    }
    console.log(`文档反同步：${docsSynced}`);

    // --- 会话与消息 ---
    const convs = await prisma.conversation.findMany({ where: { updatedAt: { gte: since } } });
    const chatDetailCol = chatDb.collection<LegacyDoc>('ai_chat_detail');
    for (const conv of convs) {
      const c = conv as unknown as {
        id: string;
        title: string;
        summary: string;
        updatedAt: Date;
        createdAt: Date;
      };
      const messages = await prisma.message.findMany({
        where: { conversationId: c.id },
        orderBy: { createdAt: 'asc' },
      });
      await chatDetailCol.updateOne(
        { _id: c.id },
        {
          $set: {
            _id: c.id,
            title: c.title,
            summary: c.summary,
            category: 'recent',
            types: messages.map((m) => {
              const mm = m as unknown as {
                id: string;
                role: string;
                parts: unknown;
                clientMessageId: string | null;
              };
              return {
                id: mm.clientMessageId || mm.id,
                role: mm.role.toLowerCase(),
                parts: mm.parts,
              };
            }),
            created_at: c.createdAt.toISOString(),
            updated_at: c.updatedAt.toISOString(),
          },
        },
        { upsert: true }
      );
    }
    console.log(`会话反同步：${convs.length}`);

    // --- 活动：写回 edit_history（尽力映射） ---
    const acts = await prisma.activity.findMany({ where: { occurredAt: { gte: since } } });
    const actCol = activityDb.collection<LegacyDoc>('edit_history');
    let actsSynced = 0;
    for (const act of acts) {
      const a = act as unknown as { id: string; documentId: string; occurredAt: Date };
      const doc = await prisma.document.findUnique({
        where: { id: a.documentId },
        include: { repository: true },
      });
      if (!doc) continue;
      const d = doc as unknown as {
        title: string;
        contentHtml: string | null;
        repositoryId: string;
      };
      await actCol.updateOne(
        { _id: a.id },
        {
          $set: {
            _id: a.id,
            repository_id: d.repositoryId,
            title: `修改了文档: ${d.title}`,
            author: '',
            repository_name: '',
            updated_time: a.occurredAt.toISOString(),
          },
        },
        { upsert: true }
      );
      actsSynced++;
    }
    console.log(`活动反同步：${actsSynced}`);
    console.log('✓ 反同步完成。切回 DATA_BACKEND=mongodb 前请用 data:validate 复核。');
  } finally {
    await prisma.$disconnect().catch(() => undefined);
    await mongo.close().catch(() => undefined);
  }
}

main().catch((err) => {
  console.error('✗ 反同步失败：', err);
  process.exit(1);
});
