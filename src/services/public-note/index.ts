import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { PublicNoteDetail } from '@/types/public-note';
import { RecommendDetailType } from '@/components/layout/Stroll/types/recommend';

function stripHtml(value: string) {
  return value.replace(/<[^>]+>/g, '').trim();
}

function mapRecommendDetailToPublicNote(detail: RecommendDetailType): PublicNoteDetail {
  return {
    id: detail._id,
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
