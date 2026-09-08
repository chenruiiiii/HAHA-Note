## Why

HAHA Note already has public content routes, but the current App Router pages do not expose a consistent SEO contract. Public note detail content is loaded on the client, global metadata is missing, and crawler behavior for private application routes is not explicit, making shared links and search previews weaker than the product can support.

## What Changes

- Add a site-wide SEO baseline with default title, description, metadata base, icon references, OpenGraph, and Twitter metadata.
- Generate dynamic metadata for public note detail pages from server-side note data, including title, summary, author/source context, canonical URL, and share preview fields.
- Make public note detail pages render their primary content from server-side data so crawlers and link unfurlers can read meaningful content without waiting for client API calls.
- Define crawler boundaries so public content can be indexed while authenticated application/workspace routes are marked `noindex`.
- Add crawler discovery endpoints for `robots.txt` and `sitemap.xml`, using `NEXT_PUBLIC_SITE_URL` for absolute URLs when configured.
- Include the stroll recommendation detail route in the SEO plan, but gate full dynamic SEO on replacing its mock detail data with a real server-side data source.
- No breaking changes.

## Capabilities

### New Capabilities

- `seo/metadata`: Defines how HAHA Note exposes search and social metadata, crawlability rules, and discoverable public URLs.

### Modified Capabilities

- None.

## Impact

- Affected routes: `app/layout.tsx`, `app/public-note/[id]/page.tsx`, public/authenticated route layouts, `app/robots.ts`, `app/sitemap.ts`, and optionally `app/stroll-recommend/[id]/page.tsx`.
- Affected data access: reuse `getPublicNoteDetailById` for server-side metadata and public note rendering; add or reuse a server-side recommendation detail lookup before enabling dynamic SEO for stroll recommendations.
- Affected configuration: document and read `NEXT_PUBLIC_SITE_URL` for absolute canonical and sitemap URLs, with safe fallbacks when absent.
- No new runtime dependency is expected.
