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

export interface ExploreArticleBrief {
  /** 用于公开笔记详情页 URL 的 id。 */
  id: string;
  /** keyset 分页游标（ExploreArticle 主键）。 */
  cursorId: string;
  title: string;
}

/**
 * 按主键升序 keyset 分页读取公开笔记的 (id, title)。
 *
 * 供 sitemap 等需要遍历全量公开笔记的场景使用：keyset 分页在数据变动时不会像
 * offset 分页那样漏读或重复。
 */
export async function listExploreArticleBriefs(
  limit: number,
  cursor?: string
): Promise<ExploreArticleBrief[]> {
  const prisma = getPrisma();
  const rows = await prisma.exploreArticle.findMany({
    where: cursor ? { id: { gt: cursor } } : undefined,
    orderBy: { id: 'asc' },
    take: Math.min(Math.max(limit, 1), 500),
    select: { id: true, legacyNumericId: true, titleHtml: true },
  });

  return rows.map((row) => ({
    id: row.legacyNumericId || row.id,
    cursorId: row.id,
    title: strip(row.titleHtml),
  }));
}
