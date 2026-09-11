/**
 * 一次性 MongoDB → PostgreSQL 迁移 CLI。
 *
 * 用法（见 package.json）：
 *   pnpm data:migrate:dry               # --dry-run：只读取与转换，不写库
 *   pnpm data:migrate                   # --execute：需要 LEGACY_OWNER_ID
 *   pnpm exec tsx scripts/migrate-mongo-to-postgres.ts --dry-run --limit 500
 *
 * 依赖环境变量：APP_MONGODB_MONGODB_URI（读取源）、MIGRATION_DATABASE_URL 或
 * DATABASE_URL（写入目标）、LEGACY_OWNER_ID（--execute 必需）。
 *
 * 先 `pnpm db:generate`（src/generated 已被 gitignore，新 clone 需先生成）。
 */
import 'dotenv/config';
import { MongoClient } from 'mongodb';
import { PrismaClient } from '../src/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import * as fs from 'node:fs';
import * as path from 'node:path';
import {
  MigrationState,
  convertUser,
  convertRepository,
  convertDocument,
  convertConversation,
  convertActivity,
  convertExploreArticle,
  summarize,
  type DbLike,
  type LegacyUserRow,
  type LegacyRepoRow,
  type LegacyDocRow,
  type LegacyChatDetail,
  type LegacyActivityRow,
  type LegacyExploreRow,
} from './migrate-core';

const CHECKPOINT_DIR = '.migration-checkpoints';

interface SourceCollections {
  users: LegacyUserRow[];
  repositories: LegacyRepoRow[];
  documents: LegacyDocRow[];
  conversations: LegacyChatDetail[];
  activities: Array<{ row: LegacyActivityRow; type: 'DOCUMENT_UPDATED' | 'DOCUMENT_VIEWED' }>;
  exploreArticles: LegacyExploreRow[];
}

function parseArgs(argv: string[]) {
  const args: { dryRun: boolean; limit?: number } = { dryRun: true };
  for (let i = 2; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--execute') args.dryRun = false;
    else if (arg === '--dry-run') args.dryRun = true;
    else if (arg === '--limit') args.limit = Number(argv[++i]);
  }
  return args;
}

// 实际运行时使用的数据库/集合名（与各 API 路由一致）
const MONGO_DBS: Record<string, { db: string; collection: string }> = {
  users: { db: 'ha_admin', collection: 'users' },
  repositories: { db: 'repository', collection: 'repo_list' },
  documents: { db: 'repository', collection: 'docs_detail' },
  conversations: { db: 'ai-chat', collection: 'ai_chat_detail' },
  exploreArticles: { db: 'stroll-recommend', collection: 'recommend_details' },
};

// 首页两个活动集合各自映射到不同 ActivityType
const ACTIVITY_SOURCES: Array<{
  db: string;
  collection: string;
  type: 'DOCUMENT_UPDATED' | 'DOCUMENT_VIEWED';
}> = [
  { db: 'user_activity', collection: 'edit_history', type: 'DOCUMENT_UPDATED' },
  { db: 'user_activity', collection: 'browse_history', type: 'DOCUMENT_VIEWED' },
];

async function readSources(client: MongoClient, limit?: number): Promise<SourceCollections> {
  const out: Record<string, unknown> = {};
  for (const [key, cfg] of Object.entries(MONGO_DBS)) {
    const cursor = client.db(cfg.db).collection(cfg.collection).find({});
    if (limit) cursor.limit(limit);
    out[key] = await cursor.toArray();
  }
  out.activities = await readActivities(client, limit);
  return out as unknown as SourceCollections;
}

async function readActivities(
  client: MongoClient,
  limit?: number
): Promise<Array<{ row: LegacyActivityRow; type: 'DOCUMENT_UPDATED' | 'DOCUMENT_VIEWED' }>> {
  const rows: Array<{ row: LegacyActivityRow; type: 'DOCUMENT_UPDATED' | 'DOCUMENT_VIEWED' }> = [];
  for (const source of ACTIVITY_SOURCES) {
    const cursor = client.db(source.db).collection(source.collection).find({});
    if (limit) cursor.limit(limit);
    const found = (await cursor.toArray()) as unknown as LegacyActivityRow[];
    rows.push(...found.map((row) => ({ row, type: source.type })));
  }
  return rows;
}

async function main() {
  const { dryRun, limit } = parseArgs(process.argv);
  const mode = dryRun ? 'dry-run' : 'execute';
  const legacyOwnerId = process.env.LEGACY_OWNER_ID ?? '';
  if (!dryRun && !legacyOwnerId) {
    console.error('✗ --execute 需要 LEGACY_OWNER_ID（PostgreSQL 用户 id），且必须是已存在的用户。');
    process.exit(1);
  }

  const mongoUri = process.env.APP_MONGODB_MONGODB_URI;
  if (!mongoUri) {
    console.error('✗ 缺少 APP_MONGODB_MONGODB_URI');
    process.exit(1);
  }
  const pgUrl = process.env.MIGRATION_DATABASE_URL || process.env.DATABASE_URL;
  if (!pgUrl) {
    console.error('✗ 缺少 MIGRATION_DATABASE_URL / DATABASE_URL');
    process.exit(1);
  }

  const state = new MigrationState(mode, legacyOwnerId);
  if (!fs.existsSync(CHECKPOINT_DIR)) fs.mkdirSync(CHECKPOINT_DIR, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  state.checkpointFile = path.join(CHECKPOINT_DIR, `checkpoint-${mode}-${stamp}.json`);
  state.quarantineFile = path.join(CHECKPOINT_DIR, `quarantine-${mode}-${stamp}.json`);

  const mongo = new MongoClient(mongoUri);
  const adapter = new PrismaPg({ connectionString: pgUrl });
  const prisma = new PrismaClient({ adapter });
  const db = prisma as unknown as DbLike;

  try {
    await mongo.connect();
    console.log(`[migrate] mode=${mode} 读取 Mongo 源…`);
    const sources = await readSources(mongo, limit);

    for (const row of sources.users) await convertUser(state, db, row);
    for (const row of sources.repositories) await convertRepository(state, db, row);
    for (const row of sources.documents) await convertDocument(state, db, row);
    for (const row of sources.conversations) await convertConversation(state, db, row, {});
    for (const { row, type } of sources.activities) await convertActivity(state, db, row, type);
    for (const row of sources.exploreArticles) await convertExploreArticle(state, db, row);

    state.report.finishedAt = new Date().toISOString();
    console.log(`\n[结果报告]\n${summarize(state.report)}`);
    console.log(`\n[隔离区] ${state.report.quarantine.length} 条：`);
    for (const q of state.report.quarantine.slice(0, 20)) {
      console.log(`  - ${q.source}:${q.legacyId} ${q.reason}`);
    }

    fs.writeFileSync(state.checkpointFile, JSON.stringify(state.report.counts, null, 2));
    fs.writeFileSync(state.quarantineFile, JSON.stringify(state.report.quarantine, null, 2));
    console.log(`\ncheckpoint → ${state.checkpointFile}`);
    console.log(`quarantine → ${state.quarantineFile}`);

    if (state.report.quarantine.length > 0 && mode === 'execute') {
      console.warn('⚠ 存在隔离行，请人工确认后再进入 cutover。');
    }
  } finally {
    await prisma.$disconnect().catch(() => undefined);
    await mongo.close().catch(() => undefined);
  }
}

main().catch((err) => {
  console.error('✗ 迁移失败：', err);
  process.exit(1);
});
