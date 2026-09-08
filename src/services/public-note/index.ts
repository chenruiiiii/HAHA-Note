import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { PublicNoteDetail } from '@/types/public-note';
import { RecommendDetailType } from '@/components/layout/Stroll/types/recommend';

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

export async function getPublicNoteDetailById(id: string): Promise<PublicNoteDetail | null> {
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

export interface PublicNoteListItem {
  /** 用于公开笔记详情页 URL 的 id。 */
  id: string;
  title: string;
}

/**
 * 返回全部公开笔记的 (id, title) 列表，供 sitemap 等场景分页使用。
 *
 * 说明：`recommend_details` 集合无可靠时间戳字段，因此此处不派生 `updatedAt`，
 * 下游 sitemap 据此省略 `lastmod`（sitemap 规范允许）。
 */
export async function getPublicNoteList(limit: number, cursor?: string): Promise<PublicNoteListItem[]> {
  const client = await clientPromise;
  const db = client.db('stroll-recommend');
  const collection = db.collection<RecommendDetailType>('recommend_details');

  const filter = cursor ? ({ _id: { $gt: cursor } } as never) : {};
  const docs = await collection
    .find(filter)
    .sort({ _id: 1 })
    .limit(limit)
    .toArray();

  return docs.map((doc) => ({
    id: doc.id ?? doc._id,
    title: stripHtml(doc.title_html),
  }));
}