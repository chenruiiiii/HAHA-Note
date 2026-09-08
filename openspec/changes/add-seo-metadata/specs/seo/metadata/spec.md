## Purpose

Defines how HAHA Note exposes search-engine and social-sharing metadata for public content while keeping authenticated workspace pages out of crawler indexes.

## ADDED Requirements

### Requirement: Site-wide default metadata
The system SHALL provide default site metadata for pages that do not define route-specific metadata, including a site name, title template, description, icons, OpenGraph metadata, and Twitter card metadata.

#### Scenario: Page uses default metadata
- **WHEN** a route does not provide custom metadata
- **THEN** the rendered document exposes HAHA Note default metadata suitable for browser titles, search snippets, and social link previews

#### Scenario: Site URL is configured
- **WHEN** `NEXT_PUBLIC_SITE_URL` is configured
- **THEN** canonical, OpenGraph, sitemap, and robots URLs use that value as their absolute origin

#### Scenario: Site URL is missing
- **WHEN** `NEXT_PUBLIC_SITE_URL` is not configured
- **THEN** the system still renders valid metadata without hard-coding an incorrect production origin

### Requirement: Public note metadata
The system SHALL generate public note detail metadata from the public note's server-side title, summary, author, source, and identifier.

#### Scenario: Existing public note is requested
- **WHEN** a public note detail page is requested with an identifier that resolves to a note
- **THEN** the page metadata includes a note-specific title, description, canonical URL, OpenGraph URL, OpenGraph title, OpenGraph description, and Twitter card title and description

#### Scenario: Public note has sparse fields
- **WHEN** a public note exists but title, summary, author, or source fields are empty
- **THEN** the page metadata falls back to safe HAHA Note defaults without rendering empty or malformed metadata values

#### Scenario: Public note does not exist
- **WHEN** a public note detail page is requested with an identifier that does not resolve to a note
- **THEN** the page returns a not-found response and does not expose misleading metadata for unrelated content

### Requirement: Public content is server-rendered for crawlers
The system SHALL render the primary public note title, summary, and article content in the initial server response for public note detail pages.

#### Scenario: Crawler fetches public note detail
- **WHEN** a crawler or link unfurler requests an existing public note detail page without running client-side data fetching
- **THEN** the response contains the note's meaningful title, summary, and article content

#### Scenario: Browser fetches public note detail
- **WHEN** a browser requests an existing public note detail page
- **THEN** the user-visible page continues to show the same public note content and loading/error behavior remains appropriate for navigation states

### Requirement: Private application pages are not indexable
The system SHALL mark authenticated workspace and application pages as non-indexable by search engines unless a route is explicitly designed as public content.

#### Scenario: Authenticated app route is requested
- **WHEN** a crawler requests a private application route such as workspace, repository, editor, collection, performance, AI chat, login, or personal center pages
- **THEN** the route metadata instructs crawlers not to index the page

#### Scenario: Public content route is requested
- **WHEN** a crawler requests a public content route such as a public note detail page
- **THEN** the route remains eligible for indexing unless the content is missing or access is denied

### Requirement: Crawler discovery endpoints
The system SHALL expose crawler discovery endpoints for robots rules and sitemap URLs.

#### Scenario: Robots file is requested
- **WHEN** `/robots.txt` is requested
- **THEN** the response identifies allowed public routes, disallowed private application routes, and the sitemap URL when a site origin is available

#### Scenario: Sitemap is requested
- **WHEN** `/sitemap.xml` is requested
- **THEN** the response lists stable public routes that the system can safely expose without leaking private or authenticated content

### Requirement: Stroll recommendation metadata readiness
The system SHALL only expose dynamic SEO metadata for stroll recommendation detail pages when the page reads real recommendation data server-side instead of mock content.

#### Scenario: Recommendation detail uses mock data
- **WHEN** the stroll recommendation detail page still uses hard-coded detail data
- **THEN** the system does not present mock-specific metadata as real indexed content

#### Scenario: Recommendation detail uses real server data
- **WHEN** the stroll recommendation detail page resolves real recommendation detail data server-side
- **THEN** the page metadata is generated from the recommendation title, description, author/source, identifier, and canonical URL
