## Why

HAHA Note already has public content routes, but the current App Router pages do not expose a consistent SEO contract. Public note detail content is loaded on the client, global metadata is missing, and crawler behavior for private application routes is not explicit, making shared links and search previews weaker than the product can support.

## What Changes

- Add a site-wide SEO baseline with default title, description, metadata base, icon references, OpenGraph, and Twitter metadata, plus a static default share image (1200×630).
- Generate dynamic metadata for public note detail pages from server-side note data, including title, summary, author/source context, canonical URL, and share preview fields.
- Add structured data: `Article` JSON-LD on public note detail pages (author = note author nickname as `Person`, publisher = HAHA Note as `Organization`) and a site-level `WebSite` JSON-LD, omitting empty fields rather than emitting malformed values.
- Make public note detail pages render their primary content from server-side data so crawlers and link unfurlers can read meaningful content without waiting for client API calls.
- Define crawler boundaries so public content can be indexed while authenticated application/workspace routes are marked `noindex`, and non-production deployments are globally `noindex`.
- Add crawler discovery endpoints for `robots.txt` and `sitemap.xml`. The sitemap lists stable public routes (homepage, stroll list, and published public note detail pages), omits `changefreq`/`priority`, and paginates public notes through a `getPublicNoteList(cursor, limit)` accessor. `lastmod` is omitted because the underlying public note records do not currently expose a reliable update timestamp.
- Use `NEXT_PUBLIC_BASE_URL` (the project's existing site origin variable) for absolute canonical, OpenGraph, robots, and sitemap URLs. When absent, omit `canonical`/`og:url` tags and return an empty sitemap URL list.
- Include the stroll recommendation detail route in the SEO plan, but gate full dynamic SEO on replacing its mock detail data with a real server-side data source.
- No breaking changes.

## Capabilities

### New Capabilities

- `seo/metadata`: Defines how HAHA Note exposes search and social metadata, structured data, crawlability rules, and discoverable public URLs.

### Modified Capabilities

- None.

## Impact

- Affected routes: `app/layout.tsx`, `app/public-note/[id]/page.tsx`, public/authenticated route layouts, `app/robots.ts`, `app/sitemap.ts`, and optionally `app/stroll-recommend/[id]/page.tsx`.
- Affected data access: reuse `getPublicNoteDetailById` for server-side metadata and public note rendering; add a `getPublicNoteList` accessor for sitemap enumeration; add or reuse a server-side recommendation detail lookup before enabling dynamic SEO for stroll recommendations.
- Affected configuration: document and read `NEXT_PUBLIC_BASE_URL` for absolute canonical and sitemap URLs, with safe fallbacks (omit tags / empty sitemap) when absent.
- Public note contract: a note is publicly indexable only when it is published and public, and public note detail routes are anonymously accessible.
- No new runtime dependency is expected.