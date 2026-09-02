## Why

HAHA-Note persists business data in multiple MongoDB databases/collections with duplicated lists, missing ownership, plaintext passwords, and no schema or migration tooling. As the product grows toward permissions, versions, sharing, AI sessions, and multimodal assets, MongoDB's embedded documents are becoming a correctness and security liability. This change replaces MongoDB with managed PostgreSQL + Prisma as the single source of truth for business data while keeping existing API contracts compatible.

## What Changes

- Add Prisma 7 PostgreSQL datasource and schema covering User, Session, Repository, RepositoryMember, RepositoryFavorite, Document, DocumentRevision, DocumentFavorite, DocumentShareLink, Conversation, Message, Asset, MessageAsset, Activity, and ExploreArticle.
- Add a server-only Prisma client and DAL with owner/member authorization so API route handlers stop talking to MongoDB directly.
- Add an idempotent migration pipeline: MongoDB reader -> converter -> Prisma writer, with dry-run, quarantine, and validation reports.
- Add a `DATA_BACKEND` switch plus environment configuration for the pooled runtime URL and direct migration URL.
- Convert all current API routes and seed scripts to the DAL/Prisma path.
- Hash plaintext passwords and persist session/refresh-token hashes as part of the User/Session migration.
- Remove `mongodb` usage from application code after cutover; keep MongoDB read-only during the retention window.
- Keep existing HTTP DTOs and client API shapes compatible. Frontend state management is out of scope for this change.
- **BREAKING**: the internal data layer changes from MongoDB to PostgreSQL; production cutover is a maintenance window with a validated rollback plan.

## Capabilities

### New Capabilities

- `database/postgresql-data-layer`: Prisma schema, server-only client, DAL authorization, and CRUD contracts for all business entities.
- `database/mongodb-to-postgresql-migration`: one-time idempotent migration, content conversion, validation, cutover, and rollback process.

### Modified Capabilities

None yet; this is the first OpenSpec capability in the repository.

## Impact

- Affected code: `src/lib/mongodb.ts`, all `app/api/**` routes importing MongoDB, `src/services/**`, `src/scripts/**`, and new `prisma/`, `src/server/dal/`, and `scripts/` modules.
- Dependencies: add `prisma`, `@prisma/client`, `@prisma/adapter-pg`, `pg`, `tsx`, `dotenv`, and HTML sanitization/conversion tooling; remove `mongodb` after cutover.
- Systems: managed PostgreSQL for dev/test/prod, MongoDB kept read-only during the retention window, pooled vs direct connection URLs, and environment variables.
- Non-goals: Redux -> TanStack Query/Zustand, object storage, multimodal UI, public-sharing UI, performance dashboard, and offline editing.
