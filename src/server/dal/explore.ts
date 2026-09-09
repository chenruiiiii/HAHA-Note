import 'server-only';
import sanitizeHtml from 'sanitize-html';
import { getPrisma } from '@/lib/prisma';
import type { RecommendDetailType } from '@/components/layout/Stroll/types/recommend';
import type { PublicNoteDetail } from '@/types/public-note';
import { toIsoDateTime } from './dto';

const HTML_OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: sanitizeHtml.defaults.allowedTags.concat(['img', 'h1', 'h2', 'h3']),
  allowedAttributes: {
    ...sanitizeHtml.defaults.allowedAttributes,
    img: ['src', 'alt', 'title'],
  },
};

function sanitize(value: string): string {
  return sanitizeHtml(value, HTML_OPTIONS);
}

function strip(value: string): string {
  return sanitizeHtml(value, { allowedTags: [], allowedAttributes: {} }).trim();
}

export function toRecommendDetail(article: {
  id: string;
  legacyNumericId: string | null;
  sourcePlatform: string;
  sourceTitle: string;
  sourceAvatarUrl: string | null;
  authorName: string;
  authorAvatarUrl: string | null;
  titleHtml: string;
  descriptionHtml: string;
  contentHtml: string;
  qualityLevel: string;
  likeCount: number;
  commentCount: number;
  wordCount: number;
  sourceUrl: string;
}): RecommendDetailType {
  return {
    _id: article.legacyNumericId || article.id,
    id: article.id,
    source: {
      platform: article.sourcePlatform === 'yuque' ? 'yuque' : 'community',
      title: article.sourceTitle,
      avatar: article.sourceAvatarUrl ?? undefined,
    },
    author: {
      name: article.authorName,
      avatar: article.authorAvatarUrl ?? undefined,
    },
    title_html: sanitize(article.titleHtml),
    description_html: sanitize(article.descriptionHtml),
    content_html: sanitize(article.contentHtml),
    quality_level: article.qualityLevel === 'featured' ? 'featured' : 'normal',
    like_count: article.likeCount,
    comment_count: article.commentCount,
    word_count: article.wordCount,
    source_url: article.sourceUrl,
  };
}

export function toPublicNoteDetail(article: {
  id: string;
  legacyNumericId: string | null;
  sourceTitle: string;
  sourceAvatarUrl: string | null;
  authorName: string;
  authorAvatarUrl: string | null;
  titleHtml: string;
  descriptionHtml: string;
  contentHtml: string;
  qualityLevel: string;
  likeCount: number;
  commentCount: number;
  wordCount: number;
  sourceUrl: string;
  updatedAt: Date;
}): PublicNoteDetail {
  const titleHtml = sanitize(article.titleHtml);
  const summaryHtml = sanitize(article.descriptionHtml);

  return {
    id: article.legacyNumericId || article.id,
    title: strip(titleHtml),
    titleHtml,
    summary: strip(summaryHtml),
    summaryHtml,
    sourceName: article.sourceTitle,
    sourceAvatar: article.sourceAvatarUrl ?? undefined,
    sourceTag: article.qualityLevel === 'featured' ? '语雀精选' : '社区精选',
    authorName: article.authorName,
    authorAvatar: article.authorAvatarUrl ?? undefined,
    contentHtml: sanitize(article.contentHtml),
    likeCount: article.likeCount,
    commentCount: article.commentCount,
    wordCount: article.wordCount,
    updatedAt: toIsoDateTime(article.updatedAt).slice(0, 10),
    docUrl: article.sourceUrl,
  };
}

export async function listExploreArticles(limit = 50): Promise<RecommendDetailType[]> {
  const prisma = getPrisma();
  const rows = await prisma.exploreArticle.findMany({
    orderBy: { updatedAt: 'desc' },
    take: Math.min(Math.max(limit, 1), 100),
  });

  return rows.map(toRecommendDetail);
}

export async function findExploreArticleById(id: string): Promise<PublicNoteDetail | null> {
  const prisma = getPrisma();
  const row = await prisma.exploreArticle.findFirst({
    where: {
      OR: [{ id }, { legacyNumericId: id }],
    },
  });

  return row ? toPublicNoteDetail(row) : null;
}
