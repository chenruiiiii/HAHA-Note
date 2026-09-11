import { PublicNoteDetail } from '@/types/public-note';
import { RecommendDetailType } from '@/components/layout/Stroll/types/recommend';
import { isPrismaBackend } from '@/server/auth/backend';
import { findExploreArticleById, listExploreArticleBriefs } from '@/server/dal/explore';

function stripHtml(value: string) {
  return value.replace(/<[^>]+>/g, '').trim();
}

function mapRecommendDetailToPublicNote(detail: RecommendDetailType): PublicNoteDetail {
  return {
    id: detail.id ?? detail._id,
    title: stripHtml(detail.title_html),
    titleHtml: detail.title_html,
    summary: stripHtml(detail.description_html),
    summaryHtml: detail.description_html,
    sourceName: detail.source.title,
    sourceAvatar: detail.source.avatar,
    sourceTag: detail.quality_level === 'featured' ? '语雀精选' : '社区精选',
    authorName: detail.author.name,
    authorAvatar: detail.author.avatar,
    contentHtml: detail.content_html,
    likeCount: detail.like_count,
    commentCount: detail.comment_count,
    wordCount: detail.word_count,
    updatedAt: new Date().toISOString().slice(0, 10),
    docUrl: detail.source_url ?? '',
  };
}

/**
 * Mongo 模式：按 id 或 ObjectId 读取公开笔记。
 *
 * 这里用动态 import 引入 Mongo 客户端，使 Prisma 模式下既不加载驱动、也不要求
 * MONGODB_URI 存在（构建期同样如此）。
 */
async function findPublicNoteInMongo(id: string): Promise<PublicNoteDetail | null> {
  const [{ default: clientPromise }, { ObjectId }] = await Promise.all([
    import('@/lib/mongodb'),
    import('mongodb'),
  ]);
  const client = await clientPromise;
  const db = client.db('stroll-recommend');
  const collection = db.collection<RecommendDetailType>('recommend_details');
  const detail =
    (await collection.findOne({ id })) ||
    (ObjectId.isValid(id) ? await collection.findOne({ _id: new ObjectId(id) } as never) : null);

  if (!detail) {
    return null;
  }

  return mapRecommendDetailToPublicNote(detail);
}

export async function getPublicNoteDetailById(id: string): Promise<PublicNoteDetail | null> {
  if (isPrismaBackend()) {
    return findExploreArticleById(id);
  }

  return findPublicNoteInMongo(id);
}

export interface PublicNoteListItem {
  /** 用于公开笔记详情页 URL 的 id。 */
  id: string;
  /** 分页续取游标；Prisma 模式为 ExploreArticle 主键，Mongo 模式与 id 相同。 */
  cursorId?: string;
  title: string;
}

/** Mongo 模式：按 _id 升序分页读取公开笔记。 */
async function listPublicNotesInMongo(
  limit: number,
  cursor?: string
): Promise<PublicNoteListItem[]> {
  const { default: clientPromise } = await import('@/lib/mongodb');
  const client = await clientPromise;
  const db = client.db('stroll-recommend');
  const collection = db.collection<RecommendDetailType>('recommend_details');

  const filter = cursor ? ({ _id: { $gt: cursor } } as never) : {};
  const docs = await collection.find(filter).sort({ _id: 1 }).limit(limit).toArray();

  return docs.map((doc) => {
    const id = doc.id ?? doc._id;
    return { id, cursorId: id, title: stripHtml(doc.title_html) };
  });
}

/**
 * 返回全部公开笔记的 (id, title) 列表，供 sitemap 等场景分页使用。
 *
 * Prisma 模式读取 ExploreArticle；Mongo 模式保留历史行为。
 * 说明：列表项不派生 `updatedAt`，下游 sitemap 据此省略 `lastmod`（sitemap 规范允许）。
 */
export async function getPublicNoteList(
  limit: number,
  cursor?: string
): Promise<PublicNoteListItem[]> {
  if (isPrismaBackend()) {
    return listExploreArticleBriefs(limit, cursor);
  }

  return listPublicNotesInMongo(limit, cursor);
}
