## Purpose

Defines how HAHA Note exposes search-engine and social-sharing metadata for public content while keeping authenticated workspace pages out of crawler indexes.

## ADDED Requirements

### Requirement: Site-wide default metadata
The system SHALL provide default site metadata for pages that do not define route-specific metadata, including a site name, title template, description, icons, OpenGraph metadata, Twitter card metadata, a static default OpenGraph share image, and a site-level `WebSite` JSON-LD block.

#### Scenario: Page uses default metadata
- **WHEN** a route does not provide custom metadata
- **THEN** the rendered document exposes HAHA Note default metadata suitable for browser titles, search snippets, and social link previews

#### Scenario: Default share image is rendered
- **WHEN** a public page lacks a page-specific share image
- **THEN** the document references a static default OpenGraph image (1200×630) instead of omitting the OpenGraph image fields

#### Scenario: Site URL is configured
- **WHEN** `NEXT_PUBLIC_SITE_URL` is configured
- **THEN** canonical, OpenGraph, sitemap, and robots URLs use that value as their absolute origin

#### Scenario: Site URL is missing
- **WHEN** `NEXT_PUBLIC_SITE_URL` is not configured
- **THEN** the system still renders valid metadata but omits `canonical` and `og:url` tags rather than emitting a relative or hard-coded origin

### Requirement: Public note metadata
The system SHALL generate public note detail metadata from the public note's server-side title, summary, author, source, and identifier.

#### Scenario: Existing public note is requested
- **WHEN** a public note detail page is requested with an identifier that resolves to a public note
- **THEN** the page metadata includes a note-specific title, description, canonical URL, OpenGraph URL, OpenGraph title, OpenGraph description, and Twitter card title and description

#### Scenario: Article structured data is emitted
- **WHEN** a public note detail page renders metadata for an existing note
- **THEN** the document includes an `Article` JSON-LD block using the note title and summary, the note author nickname as a `Person`, HAHA Note as the `Organization` publisher, and the note identifier as the article identifier

#### Scenario: Public note has sparse fields
- **WHEN** a public note exists but title, summary, author, or source fields are empty
- **THEN** the page metadata and JSON-LD fall back to safe HAHA Note defaults and omit empty fields without rendering empty or malformed values

#### Scenario: Public note does not exist
- **WHEN** a public note detail page is requested with an identifier that does not resolve to a public note
- **THEN** the page returns a not-found response and does not expose misleading metadata for unrelated content

### Requirement: Public content is server-rendered for crawlers
The system SHALL render the primary public note title, summary, and article content in the initial server response for public note detail pages.

#### Scenario: Crawler fetches public note detail
- **WHEN** a crawler or link unfurler requests an existing public note detail page without running client-side data fetching
- **THEN** the response contains the note's meaningful title, summary, and article content

#### Scenario: Browser fetches public note detail
- **WHEN** a browser requests an existing public note detail page
- **THEN** the user-visible page continues to show the same public note content and loading/error behavior remains appropriate for navigation states

### Requirement: Public note visibility contract
The system SHALL treat a note as publicly indexable only when it is both published and public, and the public note detail route SHALL be anonymously accessible.

#### Scenario: Published public note
- **WHEN** a note is published and public
- **THEN** its detail page is anonymously accessible and eligible for indexing

#### Scenario: Non-public or unpublished note
- **WHEN** a note is private, unpublished, or deleted
- **THEN** its detail page returns a not-found response and is marked `noindex`, and the note is excluded from the sitemap

#### Scenario: Sensitive fields remain private
- **WHEN** a public note exposes account or contact fields beyond the display identity
- **THEN** those fields are excluded from page metadata and structured data

### Requirement: Private application pages are not indexable
The system SHALL mark authenticated workspace and application pages as non-indexable by search engines unless a route is explicitly designed as public content.

#### Scenario: Authenticated app route is requested
- **WHEN** a crawler requests a private application route such as workspace, repository, editor, collection, performance, AI chat, login, or personal center pages
- **THEN** the route metadata instructs crawlers not to index the page

#### Scenario: Public content route is requested
- **WHEN** a crawler requests a public content route such as a public note detail page
- **THEN** the route remains eligible for indexing unless the content is missing or access is denied

#### Scenario: Non-production deployment is crawled
- **WHEN** the application is served from a non-production environment such as a preview or development deployment
- **THEN** all routes are marked `noindex` so preview content is not indexed

### Requirement: Crawler discovery endpoints
The system SHALL expose crawler discovery endpoints for robots rules and sitemap URLs.

#### Scenario: Robots file is requested
- **WHEN** `/robots.txt` is requested
- **THEN** the response identifies allowed public routes, disallowed private application routes, and the sitemap URL when a site origin is available

#### Scenario: Sitemap is requested
- **WHEN** `/sitemap.xml` is requested
- **THEN** the response lists stable public routes that the system can safely expose without leaking private or authenticated content

#### Scenario: Sitemap enumerates public notes
- **WHEN** `/sitemap.xml` is requested
- **THEN** the response includes published public note detail URLs with a `lastmod` derived from each note's `updatedAt`, and omits `changefreq` and `priority`

#### Scenario: Sitemap includes static public pages
- **WHEN** `/sitemap.xml` is requested
- **THEN** the response also includes stable static public routes such as the homepage and the stroll list page

#### Scenario: Sitemap handles a large note set
- **WHEN** there are more public notes than a single response can reasonably enumerate
- **THEN** the sitemap enumerates public notes through a paginated `getPublicNoteList(cursor, limit)` accessor and stops at a bounded entry limit

#### Scenario: Sitemap with missing site URL
- **WHEN** `/sitemap.xml` is requested and `NEXT_PUBLIC_SITE_URL` is not configured
- **THEN** the response returns an empty URL set instead of emitting relative or hard-coded origin URLs

### Requirement: Stroll recommendation metadata readiness
The system SHALL only expose dynamic SEO metadata for stroll recommendation detail pages when the page reads real recommendation data server-side instead of mock content.

#### Scenario: Recommendation detail uses mock data
- **WHEN** the stroll recommendation detail page still uses hard-coded detail data
- **THEN** the system does not present mock-specific metadata as real indexed content

#### Scenario: Recommendation detail uses real server data
- **WHEN** the stroll recommendation detail page resolves real recommendation detail data server-side
- **THEN** the page metadata is generated from the recommendation title, description, author/source, identifier, and canonical URL