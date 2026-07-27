const DYNAMIC_SEGMENT_RE = /^([A-Za-z]+_)?[A-Za-z0-9-]{6,}$/;

const NAMED_ROUTE_PATTERNS: Array<[RegExp, string]> = [
  [/^\/repo-detail\/[^/]+\/[^/]+$/, '/repo-detail/[repoId]/[fileId]'],
  [/^\/repo-detail\/[^/]+\/home$/, '/repo-detail/[repoId]/home'],
  [/^\/public-note\/[^/]+$/, '/public-note/[id]'],
  [/^\/personal-center\/[^/]+$/, '/personal-center/[id]'],
  [/^\/stroll-recommend\/[^/]+$/, '/stroll-recommend/[id]'],
  [/^\/ai-chat\/[^/]+$/, '/ai-chat/[id]'],
  [/^\/api\/repo-detail\/[^/]+$/, '/api/repo-detail/[id]'],
  [/^\/api\/docs-detail\/[^/]+$/, '/api/docs-detail/[docsId]'],
  [/^\/api\/docs-summary\/[^/]+$/, '/api/docs-summary/[docsId]'],
  [/^\/api\/chat\/[^/]+$/, '/api/chat/[id]'],
  [/^\/api\/public-note\/[^/]+$/, '/api/public-note/[id]'],
];

export function normalizeRoute(pathname?: string) {
  if (!pathname) {
    return 'unknown';
  }

  const path = pathname.split('?')[0].replace(/\/$/, '') || '/';
  const matched = NAMED_ROUTE_PATTERNS.find(([pattern]) => pattern.test(path));

  if (matched) {
    return matched[1];
  }

  return path
    .split('/')
    .map((segment) => {
      if (!segment) {
        return segment;
      }

      if (/^\d+$/.test(segment) || DYNAMIC_SEGMENT_RE.test(segment)) {
        return '[id]';
      }

      return segment;
    })
    .join('/');
}

export function getCurrentRoute() {
  if (typeof window === 'undefined') {
    return 'server';
  }

  return normalizeRoute(window.location.pathname);
}
