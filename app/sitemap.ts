import type { MetadataRoute } from 'next';
import { buildAbsoluteUrl, buildPublicNoteUrl, getSiteUrl } from '@/lib/site';
import { getPublicNoteList } from '@/services/public-note';

/** 单次 sitemap 最多枚举的笔记数量，防止超大集合拖垮构建/响应。 */
const MAX_SITEMAP_NOTES = 5000;
/** 每次从数据库读取的分页大小。 */
const SITEMAP_PAGE_SIZE = 500;

/** 稳定静态公开路由（首页、漫游推荐列表）。 */
const STATIC_PUBLIC_PATHS = ['/', '/stroll'];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // 站点 origin 未配置时返回空集合，避免输出相对地址或错误 origin。
  if (!getSiteUrl()) {
    return [];
  }

  const entries: MetadataRoute.Sitemap = [];

  for (const path of STATIC_PUBLIC_PATHS) {
    const url = buildAbsoluteUrl(path);
    if (url) {
      entries.push({ url });
    }
  }

  // 分页读取公开笔记；文档无可靠时间戳，故省略 lastmod。
  let cursor: string | undefined;
  while (entries.length < MAX_SITEMAP_NOTES) {
    const items = await getPublicNoteList(SITEMAP_PAGE_SIZE, cursor);
    if (items.length === 0) {
      break;
    }

    for (const item of items) {
      const url = buildPublicNoteUrl(item.id);
      if (url) {
        entries.push({ url });
      }
    }

    if (items.length < SITEMAP_PAGE_SIZE) {
      break;
    }
    cursor = items[items.length - 1].id;
  }

  return entries;
}