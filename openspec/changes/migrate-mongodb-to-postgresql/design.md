## Context

The current app uses Next.js API route handlers that import `@/lib/mongodb` and directly query several MongoDB databases and collections. There is no Prisma/PostgreSQL, no migration tooling, no ownership enforcement, and passwords are stored in plaintext. See proposal.md for motivation.

## Goals / Non-Goals

**Goals:**
- Make managed PostgreSQL + Prisma the single source of truth for business data.
- Provide a server-only DAL with ownership/membership authorization and typed DTOs.
- Provide an idempotent, auditable MongoDB-to-PostgreSQL migration with validation and rollback.
- Harden auth in the same change: restore proxy auth, hash passwords, persist Session/refresh-token hashes.
- Support a `DATA_BACKEND` switch so the application can be rolled back during the cutover window.

**Non-Goals:**
- Redux to TanStack Query/Zustand migration.
- Object storage upload pipeline and multimodal UI.
- Public-sharing UI and performance dashboard.
- Offline editing and local draft recovery.

## Decisions

- Use managed PostgreSQL with Prisma 7 and `@prisma/adapter-pg`; do not use SQLite, because SQL dialect and constraint behavior are not equivalent for CI.
- Preserve legacy MongoDB `_id` values as PostgreSQL `id` to keep URLs and client caches stable.
- Enforce server-only data access: `src/server/**` and `src/lib/prisma.ts` import `server-only`; route handlers call DAL/services, never Prisma directly.
- Use one-time migration with a short maintenance window instead of long-term dual-write; rehearse at least three full dry runs and one reverse-sync rehearsal before production.
- Process migration in bounded batches with per-parent transactions, upserts by legacy ID, checkpoint files, and audit counts.
- Convert content HTML to TipTap JSON with `sanitize-html` plus the editor's schema-aware parser, fingerprint input/output with SHA-256, and quarantine anything unparseable.
- Assign existing data to an explicit legacy owner before migration; unknown ownership stays quarantined and is never made public.
- Hash passwords during migration and store refresh-token hashes in `Session`; never write plaintext secrets.
- Use `prisma migrate deploy` in production and pooled vs direct connection URLs for runtime vs CLI/migration.
- Keep API URLs and DTOs compatible during migration; document saves add `baseVersion` with a compatibility window.

## Risks / Trade-offs

- Legacy data lacks reliable `ownerId` -> resolve a `legacyOwnerId` before execution and quarantine unknown ownership.
- HTML cannot be converted losslessly -> enforce 100% conversion or explicit human-confirmed exceptions, never silently clear content.
- Cutover could lose new writes -> maintenance window, Mongo/Postgres snapshots, and rehearsed reverse sync from a cutover timestamp.
- Prisma/Serverless connection exhaustion -> single Prisma client, pooled URL, connection monitoring, and bounded transactions.
- API contract drift -> fixture-based contract tests comparing Mongo and Prisma implementations, and DTO serialization tests for BigInt.
- Prisma 7 ESM changes -> validate `"type": "module"` compatibility with existing scripts and `next build` before committing to the upgrade.
- AI stream completion may race message persistence -> create STREAMING message rows first, update on finish, and allow retry/failure states.

## Migration Plan

1. Create migration branch, Prisma config, schema, and first migration; provision cloud dev/test/prod PostgreSQL.
2. Build migration tooling: Mongo reader, converters, Prisma writer, checkpoint/resume, quarantine, and validation reports.
3. Run three full dry-run rehearsals against sanitized data; fix mapping/conversion issues.
4. Migrate API routes and seed scripts to DAL/Prisma behind compatible DTOs; add ownership and version-safe update tests.
5. Rehearse the production cutover timeline and reverse-sync rollback in a preview environment.
6. Execute the production maintenance window: snapshots, migrate deploy, data:migrate, data:validate, switch `DATA_BACKEND=prisma`, smoke tests, then post-cutover checks and retention cleanup.

## Resolved Decisions

- Ownership: all current data is assigned to an explicit `legacyOwnerId`; unknown or unverifiable data stays quarantined and is never made public.
- Hosting: managed PostgreSQL via Neon for dev/test/prod; connection strings are provisioned before production cutover.
- Scope: this change covers the database layer plus auth hardening; Redux/TanStack Query/Zustand and localStorage cleanup are out of scope.
- Public content: legacy public notes and explore recommendations migrate into PostgreSQL as part of this change.
- API: existing URLs and DTO shapes stay compatible; document save adds `baseVersion` with a compatibility window.
- Delivery: phased PRs; Phase 1 bootstraps Prisma, schema, auth, and the DAL foundation.
