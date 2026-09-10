import clientPromise from '@/lib/mongodb';
import type { MongoClient } from 'mongodb';
import { nanoid } from 'nanoid';
import { z } from 'zod';
import { EditDocument, BrowseDocument } from '@/components/layout/Start/types/list';

const DB_NAME = 'user_activity';
const REPO_DB_NAME = 'repository';
const HISTORY_COUNT = 200;

const ActivitySchema = z.object({
  _id: z.string(),
  repository_id: z.string(),
  docs_id: z.string(),
  title: z.string(),
  author: z.string(),
  repository_name: z.string(),
  updated_time: z.string(),
});

interface RepoDoc {
  _id: string;
  title: string;
  docs_list?: Array<{ docs_id: string; docs_name: string }>;
}

interface DetailDoc {
  _id: string;
  repository_id: string;
  title: string;
  author?: string;
}

/**
 * 从真实知识库与文档生成活动数据。
 *
 * 旧实现用随机 repository_id 且不携带文档引用，导致首页列表点击后无法构造
 * /repo-detail/{repoId}/{docsId}（404 修复的数据前提）。本函数保证：
 * - repository_id / docs_id / repository_name / title 全部来自真实数据；
 * - 先清空目标集合再写入，重跑幂等；
 * - 源集合为空时退出非零，绝不把线上列表清成空。
 */
async function buildSourceData(client: MongoClient) {
  const repoCollection = client
    .db(REPO_DB_NAME)
    .collection<RepoDoc>('repo_list');
  const detailCollection = client
    .db(REPO_DB_NAME)
    .collection<DetailDoc>('docs_detail');

  const [repos, details] = await Promise.all([
    repoCollection.find().toArray(),
    detailCollection.find().toArray(),
  ]);

  if (repos.length === 0 || details.length === 0) {
    throw new Error(
      `源数据为空（repo_list=${repos.length}, docs_detail=${details.length}），拒绝重建活动数据。请先执行 seed repos/docs。`
    );
  }

  // 文档标题优先取 docs_detail 实体，缺失时回退 repo_list.docs_list 里的名称
  const detailById = new Map(details.map((doc) => [doc._id, doc]));
  const pairs: ActivityPair[] = [];

  for (const repo of repos) {
    for (const entry of repo.docs_list ?? []) {
      const detail = detailById.get(entry.docs_id);
      if (!detail) continue;
      pairs.push({
        repository_id: repo._id,
        repository_name: repo.title,
        docs_id: entry.docs_id,
        title: detail.title || entry.docs_name,
        author: detail.author || '当前用户',
      });
    }
  }

  if (pairs.length === 0) {
    throw new Error(
      'repo_list.docs_list 与 docs_detail 没有可配对的文档，拒绝重建活动数据。请检查两个集合的数据一致性。'
    );
  }

  return pairs;
}

interface ActivityPair {
  repository_id: string;
  repository_name: string;
  docs_id: string;
  title: string;
  author: string;
}

const generateData = (count: number, prefix: 'EDIT' | 'BROWSE', pairs: ActivityPair[]) => {
  const now = Date.now();
  return Array.from({ length: count }).map((_, i) => {
    const pair = pairs[i % pairs.length];
    const verb = prefix === 'EDIT' ? '修改了' : '阅读了';
    return {
      _id: `${prefix}_${nanoid(10)}`,
      repository_id: pair.repository_id,
      docs_id: pair.docs_id,
      title: `${verb}文档: ${pair.title}`,
      author: pair.author,
      repository_name: pair.repository_name,
      // 倒序铺开时间，保证列表首屏时间看起来自然
      updated_time: new Date(now - i * 3600_000).toISOString(),
    };
  });
};

async function rebuildHistory(
  client: MongoClient,
  collectionName: "edit_history" | "browse_history",
  prefix: "EDIT" | "BROWSE",
  pairs: ActivityPair[],
) {
  const db = client.db(DB_NAME);
  const collection = db.collection<EditDocument & BrowseDocument>(collectionName);

  const data = ActivitySchema.array().parse(generateData(HISTORY_COUNT, prefix, pairs));

  // 先清空旧数据（含缺失 docs_id 的历史脏数据），再全量写入
  const removed = await collection.deleteMany({});
  const result = await collection.insertMany(data);

  console.log(
    `✅ [${DB_NAME}] ${collectionName} 重建成功：清除 ${removed.deletedCount} 条，写入 ${result.insertedCount} 条`
  );
}

// 填充编辑历史
export async function seedEditHistory() {
  const client = await clientPromise;
  const pairs = await buildSourceData(client);
  await rebuildHistory(client, 'edit_history', 'EDIT', pairs);
}

// 填充浏览历史
export async function seedBrowseHistory() {
  const client = await clientPromise;
  const pairs = await buildSourceData(client);
  await rebuildHistory(client, 'browse_history', 'BROWSE', pairs);
}
