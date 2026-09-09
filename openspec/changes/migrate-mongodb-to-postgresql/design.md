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

## Implementation Snapshot (2026-09-09, updated after round 2)

Branch `codex/migrate-db-postgres` contains Prisma 7 schema/client, password hashing (peppered), Session rotation on login/refresh/logout, `require-user`, and the full first-pass DAL (repositories, documents, conversations, activities, explore, content converter, DTO/errors, access scoping, private-json helper). Session 2 additionally delivers: `DATA_BACKEND` routing in all business routes with frozen envelopes, atomic version-safe updates, migration/validation/reverse-sync CLIs, and Vitest unit tests. Remaining after this session: production cutover rehearsals (6.4–6.6), Playwright E2E + live-PostgreSQL CI branch (6.3), contract-test fixtures against a live Mongo (6.2), and seed-script conversion (see boundary 24).

## Grill-me Boundary Decisions (2026-09-09)

Finding facts from the repo is the agent's job. The remaining product/engineering forks are locked as follows so implementation can proceed without silent scope cuts.

1. **This session's done definition**: ship the application data layer, `DATA_BACKEND` routing, migration/validation/reverse-sync CLIs, and unit tests. Production cutover rehearsals (tasks 6.4–6.6) stay a runbook because they need provisioned Neon/Mongo snapshots.
2. **Dual-backend window**: keep Mongo handlers when `DATA_BACKEND=mongodb`. Do not delete `@/lib/mongodb` from app routes until after a validated cutover (task 4.5).
3. **Prisma list/detail authorization**: owner or `RepositoryMember` only. Missing access returns 404, not a leaked 200. Mongo handlers stay unscoped so rollback behavior is unchanged.
4. **New repository visibility**: Prisma creates `PRIVATE` (schema default). Mongo historically wrote `isPublic: true`; that is treated as a legacy defect, not a contract to copy.
5. **`baseVersion` compatibility window**: if the client omits `baseVersion`, last-write-wins with a version increment. If it sends a stale `baseVersion`, return HTTP 409 with the latest DTO.
6. **Live document HTML**: sanitize and convert with a real HTML parser into TipTap JSON; do not block editor saves on conversion warnings. The 100% conversion gate applies only to migration `--execute` / `data:validate`.
7. **Chat persistence**: upsert by `(conversationId, clientMessageId)` when the UI message `id` is present; replace the stored message set to match Mongo's full-document upsert. Owner-scoped reads/writes only.
8. **Proxy + Prisma**: `proxy()` verifies the access JWT only. It MUST NOT mint a new refresh JWT without rotating `Session.refreshTokenHash`. Prisma refresh stays on `/api/auth/refresh`.
9. **Performance events**: `/api/performance` stays on Mongo. It is out of scope for this change.
10. **Explore/public notes**: Prisma maps `ExploreArticle` to the existing stroll/public-note DTOs. `/api/public-note` remains unauthenticated; `/api/stroll/*` keeps the current auth gate.
11. **Migration owner**: `--execute` requires `LEGACY_OWNER_ID`. Rows that cannot be attributed are quarantined.
12. **Tests this session**: Vitest unit tests for password, HTML conversion, field mapping, DTO serialization, and validation-gate logic. Playwright E2E and a live PostgreSQL CI branch remain follow-up (tasks 6.1 partial / 6.3).

## Grill-me Boundary Decisions — Round 2 (2026-09-09)

Second pass over the working-tree DAL code. These close races and contract gaps found in review; numbering continues above.

13. **Version-safe update must be atomic, not read-then-write**: `updateDocument` SHALL guard the write with a conditional update (`UPDATE ... WHERE id = ? AND version = baseVersion` semantics via `updateMany`) and SHALL map Prisma `P2002` on `DocumentRevision(documentId, version)` to HTTP 409. A concurrent lost save MUST surface as 409 with the latest DTO, never as a 500.
14. **Legacy empty-string semantics for `title`/`summary`**: the Mongo handlers used `body.title?.trim() || fallback`; the Prisma DAL SHALL keep `||` semantics so a blank title never blanks an existing title and create falls back to `新建文档`. `summary` keeps `??` (explicit empty summary clears it), matching the legacy handler.
15. **Response envelopes are frozen per endpoint**: `GET /api/repository`, `GET /api/start/browsed`, `GET /api/start/edited` return a bare JSON array; all other endpoints return `{ code, data, message }`; `POST /api/docs-detail/[id]` mismatch returns HTTP 409 with the existing document in `data`. The Prisma branch of every route SHALL return the byte-compatible envelope of its Mongo branch. `GET /api/repository` is now owner/member-scoped (no longer "every row in the database"), accepted as a deliberate security fix on top of the frozen envelope.
16. **Unauthenticated endpoints stay unauthenticated**: `/api/public-note/[id]` and `/api/stroll/left` SHALL NOT call `requireUser` in Prisma mode; they read `ExploreArticle` without an owner scope. Every other Prisma branch (repository, repo-detail, docs-detail, docs-summary, chat*, start/*) SHALL resolve the caller via `requireUser` and 401 without a valid access cookie.
17. **Inline mark fidelity in the converter**: `<code>` maps to the `code` mark (never a `codeBlock` inside a paragraph), `<u>` to `underline`, `<s>` to `strike`. The converter output SHALL only contain nodes/marks from the editor's StarterKit schema subset; the migration gate for "parseable" is: sanitize + htmlparser2 parse + non-empty extracted text + no block node nested inside a paragraph. Full ProseMirror schema round-trip validation stays a follow-up.
18. **Message ordering contract**: conversation reads order by `createdAt ASC`. AI SDK UI messages always carry `id`, so `(conversationId, clientMessageId)` upserts keep rows stable across saves. Messages saved without ids are delete-and-recreate per save (body order = final order); same-millisecond ties are accepted as a degraded-but-compatible path because the live chat client always sends ids.
19. **Start-page activity mapping**: `browse_history` → `ActivityType.DOCUMENT_VIEWED`, `edit_history` → `DOCUMENT_UPDATED`. Orphan activities referencing documents that do not exist are quarantined per spec; the start page MAY show fewer rows after migration than seeded Mongo showed. That is spec'd behavior, not a regression.
20. **Proxy + Prisma consequence is accepted**: `proxy()` runs on the edge runtime and cannot rotate a Prisma `Session` row. In Prisma mode an expired access cookie on a page navigation redirects to `/login?redirect=...` (access TTL is 15 minutes); XHR flows self-heal through the axios 401 → `/api/auth/refresh` interceptor. No page-level silent refresh will be added in this change.
21. **Migration CLI environment**: scripts connect to PostgreSQL with `MIGRATION_DATABASE_URL` (direct, non-pooled) falling back to `DATABASE_URL`, and to MongoDB with `MONGODB_URI`. They MUST NOT import `src/lib/prisma.ts` (it is `server-only`); they build their own `PrismaClient` + `PrismaPg`. Dry-run reads both sides and writes nothing — not even checkpoints.
22. **Reverse-sync scope**: only rows with `updatedAt >= cutover` for repositories, documents, conversations/messages, and activities are written back to Mongo; users, sessions, favorites, and explore articles are never reverse-synced (auth is already cut over; explore is read-only reference data). The rehearsal itself stays a runbook item.
23. **ha_admin user mapping**: `username` is the natural key; role `admin` → `ADMIN`, `editor` → `USER`. Plaintext passwords are bcrypt-hashed (cost 12, peppered) during migration; users with missing/blank passwords get `passwordResetRequired = true` and an unguessable random hash. Duplicate usernames are quarantined, first-wins.
24. **Seed scripts stay on Mongo this session**: `src/scripts/**` keeps writing Mongo so the rollback source can still be regenerated; converting seed scripts to Prisma (proposal "Convert seed scripts") lands after the cutover rehearsal, together with task 4.5.
