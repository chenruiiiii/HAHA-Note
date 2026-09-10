## Purpose

Defines how HAHA-Note persists and accesses business data through a PostgreSQL-backed, server-only data access layer with ownership checks and version-safe writes, replacing direct MongoDB collection access.

## ADDED Requirements

### Requirement: Server-only data access
The system SHALL expose all business data through a server-only data access layer. Client components SHALL NOT import the Prisma client or any database service, and API route handlers SHALL NOT import MongoDB driver types after cutover.

#### Scenario: Client bundle excludes database clients
- **WHEN** the production client bundle is built
- **THEN** it SHALL NOT contain Prisma client, MongoDB driver, or database connection strings

### Requirement: Ownership-scoped queries
The data access layer SHALL require an authenticated session for private data and SHALL scope every Repository, Document, Conversation, Message, Asset, Activity, and favorite query to the caller's ownership or repository membership. The system SHALL NOT trust `ownerId`, `creatorId`, or `author` from request bodies.

#### Scenario: Member reads repository documents
- **WHEN** an authenticated user who owns or belongs to a repository requests repository detail or document detail
- **THEN** the system returns only rows the user is allowed to see

#### Scenario: Non-member cannot read or write
- **WHEN** an authenticated user who is neither owner nor member requests or mutates another user's repository, document, conversation, message, or asset
- **THEN** the system returns 403 or 404 and SHALL NOT apply the mutation

### Requirement: PostgreSQL schema integrity
The PostgreSQL schema SHALL enforce referential integrity and uniqueness for legacy IDs, username/email, `(documentId, version)`, `(conversationId, clientMessageId)`, and favorite composite keys, with cascade behavior defined for dependent rows.

#### Scenario: Duplicate document revision version rejected
- **WHEN** a migration or API tries to insert a second revision with the same `documentId` and `version`
- **THEN** the database rejects the row and the operation reports a conflict

#### Scenario: Duplicate client message rejected
- **WHEN** a retried request inserts a message with the same `conversationId` and `clientMessageId`
- **THEN** the duplicate insert is rejected or treated as idempotent without creating a second message

### Requirement: Version-safe document updates
The system SHALL require the client to submit a `baseVersion` for document updates and SHALL atomically update only when the stored version matches. A mismatched update SHALL return HTTP 409 with the latest version and SHALL NOT overwrite the server content.

#### Scenario: Concurrent edit conflict
- **WHEN** two clients update the same document, the second with a stale `baseVersion`
- **THEN** the second request returns 409 and the stored document keeps the first client's content

#### Scenario: Concurrent save race resolves to 409
- **WHEN** two requests with the same valid `baseVersion` pass validation simultaneously
- **THEN** exactly one write succeeds and the other returns HTTP 409 with the latest document DTO; the rejected request SHALL NOT surface as HTTP 500

### Requirement: Secret values stored as hashes
The system SHALL store user passwords as strong hashes and refresh tokens as hashes. Plaintext passwords, plaintext refresh tokens, and token secrets SHALL NOT be written to PostgreSQL or returned by any API.

#### Scenario: Password migration writes hash only
- **WHEN** migration or registration persists a user password
- **THEN** PostgreSQL contains only the hash and never the plaintext value

### Requirement: Compatible API DTOs
The system SHALL keep existing HTTP URLs and DTO shapes compatible with current clients during migration, SHALL return DTOs instead of raw Prisma records, and SHALL serialize BigInt values safely.

#### Scenario: Asset metadata serialization
- **WHEN** an API returns asset metadata containing a large `sizeBytes`
- **THEN** the response contains a decimal string or safely bounded number and never fails JSON serialization

#### Scenario: Frozen response envelopes
- **WHEN** the Prisma backend serves `GET /api/repository`, `GET /api/start/browsed`, or `GET /api/start/edited`
- **THEN** the response body is a bare JSON array, identical in shape to the MongoDB backend
- **WHEN** the Prisma backend serves any other business endpoint
- **THEN** the response body keeps the `{ code, data, message }` envelope used by the MongoDB backend

### Requirement: Private data cache policy
Private repository, document, conversation, message, and asset APIs SHALL return `Cache-Control: private, no-store` and `Pragma: no-cache`.

#### Scenario: Private API response headers
- **WHEN** a client requests a private repository or document endpoint
- **THEN** the response includes private, no-store and no-cache headers

### Requirement: Backend switch for business APIs
While MongoDB remains the rollback source, private business APIs SHALL honor `DATA_BACKEND=mongodb|prisma`. When the value is `prisma`, handlers SHALL call the DAL and SHALL NOT query MongoDB for that request. When the value is `mongodb`, handlers MAY keep the legacy collection queries. `/api/performance` is excluded from this requirement.

#### Scenario: Prisma backend uses DAL
- **WHEN** `DATA_BACKEND=prisma` and an authenticated user requests repository, document, conversation, activity, or explore data
- **THEN** the handler reads and writes PostgreSQL through the DAL

### Requirement: Document update compatibility window
Document update requests MAY omit `baseVersion` during the compatibility window. An omitted `baseVersion` SHALL apply last-write-wins with a version increment. A provided stale `baseVersion` SHALL return HTTP 409 and SHALL NOT overwrite server content.

#### Scenario: Legacy client omits baseVersion
- **WHEN** an authenticated owner saves a document without `baseVersion`
- **THEN** the document is updated and `version` increases by one

### Requirement: New repositories are private
Newly created Prisma repositories SHALL use `Visibility.PRIVATE` unless the authenticated owner explicitly sets another visibility. The handler SHALL NOT copy the legacy Mongo `isPublic: true` default.

#### Scenario: Create repository without visibility
- **WHEN** an authenticated user creates a repository and does not send a visibility field
- **THEN** the stored row is `PRIVATE` and only that user can list or read it
