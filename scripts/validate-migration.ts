/**
 * 迁移校验 CLI：核对源(Mongo)与目标(PostgreSQL)计数 + 隔离区，任何关键不一致退出非零。
 *
 * 用法：npm run data:validate
 * 依赖：APP_MONGODB_MONGODB_URI、MIGRATION_DATABASE_URL/DATABASE_URL。
 * 在切 DATA_BACKEND=prisma 前执行；critical > 0 时 SHALL 停止 cutover。
 */
import 'dotenv/config';
import { MongoClient } from 'mongodb';
import { PrismaClient } from '../src/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const SOURCE_SPEC = [
  { entity: 'users', db: 'ha_admin', collection: 'users', target: 'user' },
  { entity: 'repositories', db: 'repository', collection: 'repo_list', target: 'repository' },
  { entity: 'documents', db: 'repository', collection: 'docs_detail', target: 'document' },
  { entity: 'conversations', db: 'ai-chat', collection: 'ai_chat_detail', target: 'conversation' },
  { entity: 'activities', db: 'user_activity', collection: 'edit_history', target: 'activity' },
  { entity: 'exploreArticles', db: 'stroll-recommend', collection: 'recommend_details', target: 'exploreArticle' },
];

interface Counters {
  source: number;
  target: number;
}

async function countBy(dbName: string, collection: string): Promise<number> {
  const mongoUri = process.env.APP_MONGODB_MONGODB_URI!;
  const client = new MongoClient(mongoUri);
  try {
    await client.connect();
    return await client.db(dbName).collection(collection).countDocuments();
  } finally {
    await client.close();
  }
}

async function main() {
  const pgUrl = process.env.MIGRATION_DATABASE_URL || process.env.DATABASE_URL;
  if (!pgUrl) throw new Error('缺少 MIGRATION_DATABASE_URL / DATABASE_URL');

  const counts: Counters[] = [];
  for (const spec of SOURCE_SPEC) {
    counts.push({ source: await countBy(spec.db, spec.collection), target: 0 });
  }

  const adapter = new PrismaPg({ connectionString: pgUrl });
  const prisma = new PrismaClient({ adapter });

  try {
    for (let i = 0; i < SOURCE_SPEC.length; i++) {
      const target = SOURCE_SPEC[i].target;
      const model = (prisma as unknown as Record<string, { count: () => Promise<number> }>)[target];
      counts[i].target = await model.count();
    }
  } finally {
    await prisma.$disconnect().catch(() => undefined);
  }

  const critical: string[] = [];
  console.log('实体           源      目标   ');
  SOURCE_SPEC.forEach((spec, i) => {
    const c = counts[i];
    console.log(`${spec.entity.padEnd(14)} ${String(c.source).padEnd(7)} ${String(c.target).padEnd(7)}`);
    if (c.source !== c.target) {
      critical.push(`${spec.entity} count mismatch: source=${c.source} target=${c.target}`);
    }
  });

  // 隔离文件是最新一次执行的 quarantine 结果
  const fs = await import('node:fs');
  const dir = '.migration-checkpoints';
  let quarantineCount = 0;
  if (fs.existsSync(dir)) {
    const files = fs.readdirSync(dir).filter((f) => f.startsWith('quarantine-'));
    if (files.length > 0) {
      const latest = files.sort().at(-1)!;
      quarantineCount = JSON.parse(fs.readFileSync(`${dir}/${latest}`, 'utf-8')).length as number;
      console.log(`\n最新 quarantine (${latest})：${quarantineCount} 条`);
    }
  }

  if (critical.length > 0 || quarantineCount > 0) {
    console.error('\n✗ 校验未通过，禁止 cutover：');
    critical.forEach((c) => console.error(`  - ${c}`));
    if (quarantineCount > 0) console.error(`  - quarantine 非空（${quarantineCount}）`);
    process.exit(1);
  }

  console.log('\n✓ 校验通过：计数一致且无隔离行。');
}

main().catch((err) => {
  console.error('✗ 校验失败：', err);
  process.exit(1);
});
