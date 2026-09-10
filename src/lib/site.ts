import { WEBSITE_INFO } from '@/constants/config.ts';

/**
 * 站点级 SEO 常量与 URL 工具。
 *
 * 统一约定：
 * - 品牌名/描述复用 `WEBSITE_INFO`（登录页等已有 UI 同源）。
 * - 站点绝对 URL 读 `NEXT_PUBLIC_BASE_URL`（与项目现有环境变量一致）。
 * - 未配置时返回 undefined，各端点据此省略 canonical/og:url 或返回空列表，
 *   避免输出指向错误 origin 的绝对地址。
 */

export const SITE_NAME = WEBSITE_INFO.name;

export const SITE_TITLE_TEMPLATE = `%s | ${SITE_NAME}`;

export const SITE_DEFAULT_DESCRIPTION = WEBSITE_INFO.description;

/** 站点绝对 origin（如 https://example.com），未配置时为 undefined。 */
export function getSiteUrl(): string | undefined {
  // 1) 显式配置的正式域名（最优先）
  const explicit = process.env.NEXT_PUBLIC_BASE_URL;
  if (explicit) {
    const trimmed = explicit.trim().replace(/\/+$/, '');
    return trimmed || undefined;
  }

  // 2) Vercel 自动注入的项目生产域名（构建时可用）
  const vercelProduction = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  if (vercelProduction) {
    return `https://${vercelProduction}`;
  }

  // 3) Vercel Preview 部署临时域名（仅作兜底，SEO 价值有限）
  const vercelUrl = process.env.VERCEL_URL;
  if (vercelUrl) {
    return `https://${vercelUrl}`;
  }

  return undefined;
}

/** 基于站点 origin 拼接绝对路径；origin 未配置时返回 undefined。 */
export function buildAbsoluteUrl(pathname: string): string | undefined {
  const base = getSiteUrl();
  if (!base) {
    return undefined;
  }

  const normalized = pathname.startsWith('/') ? pathname : `/${pathname}`;
  return `${base}${normalized}`;
}

/** 由笔记 id 构造公开笔记详情页的绝对 URL；origin 未配置时返回 undefined。 */
export function buildPublicNoteUrl(id: string): string | undefined {
  return buildAbsoluteUrl(`/public-note/${encodeURIComponent(id)}`);
}

/**
 * 判断当前是否为可被搜索引擎索引的生产环境。
 * Vercel 场景以 `VERCEL_ENV === 'production'` 为准；非 Vercel 回退到 NODE_ENV。
 */
export function isProductionEnv(): boolean {
  if (process.env.VERCEL_ENV) {
    return process.env.VERCEL_ENV === 'production';
  }
  return process.env.NODE_ENV === 'production';
}