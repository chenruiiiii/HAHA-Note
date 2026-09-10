import type { MetadataRoute } from 'next';
import { buildAbsoluteUrl } from '@/lib/site';

/**
 * 私有应用路由前缀（认证后的工作台页面），对爬虫禁用。
 *
 * 覆盖：工作台/首页、知识库、文档、收藏、性能、AI 对话、登录、个人中心、漫游推荐列表。
 * 公开内容路由（`/public-note`、`/stroll-recommend`）不在此列，保持可抓取。
 */
const DISALLOWED_PRIVATE_PREFIXES = [
  '/login',
  '/personal-center',
  '/repo-detail',
  '/collect',
  '/performance',
  '/repository',
  '/ai-chat',
  '/ai-chat-home',
  '/subtotal',
  '/stroll',
];

export default function robots(): MetadataRoute.Robots {
  const sitemapUrl = buildAbsoluteUrl('/sitemap.xml');

  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/public-note/', '/stroll-recommend/'],
        disallow: DISALLOWED_PRIVATE_PREFIXES,
      },
    ],
    ...(sitemapUrl ? { sitemap: sitemapUrl } : {}),
  };
}