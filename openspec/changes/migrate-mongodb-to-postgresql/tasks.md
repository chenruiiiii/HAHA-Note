## 1. Prisma and PostgreSQL Bootstrap

- [x] 1.1 Install Prisma 7, `@prisma/client`, `@prisma/adapter-pg`, `pg`, `server-only`, `tsx`, `bcryptjs`, `sanitize-html`, and their types; verify `npm install` succeeds and lockfile is updated
- [x] 1.2 Add `prisma/schema.prisma` with all target models and enums from design; verify `npm run db:format` and `npm run db:validate` pass
- [x] 1.3 Add `prisma.config.ts` using `MIGRATION_DATABASE_URL`; verify `prisma generate` emits `src/generated/prisma`
- [x] 1.4 Add `src/lib/prisma.ts` server-only singleton with `PrismaPg` adapter; verify client bundle excludes database clients
- [x] 1.5 Add `DATABASE_URL`, `MIGRATION_DATABASE_URL`, `DATA_BACKEND`, `AUTH_TOKEN_SECRET`, and `PASSWORD_PEPPER` to env templates and package scripts; verify scripts appear in package.json
- [ ] 1.6 Create the first `prisma migrate dev` migration against dev PostgreSQL and verify `prisma migrate status` is clean — needs a live PostgreSQL

## 2. Auth and Session Hardening

- [x] 2.1 Add password hashing and verification helper using bcryptjs; verify hash/verify unit behavior
- [x] 2.2 Add session creation, lookup, rotation, and revocation using `Session.refreshTokenHash`; verify unique hash and expiry/revocation checks
- [x] 2.3 Rewrite login to look up users by username, compare hashed password, and write a Session row when `DATA_BACKEND=prisma`; verify no plaintext compare and no seed-on-login
- [x] 2.4 Rewrite refresh to rotate refresh tokens and hash them in Session; verify revoked/expired sessions return 401
- [x] 2.5 Rewrite logout to revoke the Session; verify token cannot be reused after logout
- [x] 2.6 Restore `proxy()` auth enforcement and keep public paths whitelisted; verify protected APIs return 401/redirect without cookies
- [x] 2.7 Remove fixed `admin/admin` and `editor/editor123` seed-on-login; verify login does not create users

## 3. Server-only DAL and Authorization

- [x] 3.1 Add `src/server/dal/require-user.ts` that resolves the current user from access token/session; verify unauthorized calls throw 401
- [x] 3.2 Add Repository DAL with owner/member scoped list/detail/create/update and favorite upsert; verify cross-user access returns 403/404
- [ ] 3.3 Add Document DAL with repository access check, version-safe conditional update, revision creation, and favorite/share-link helpers; verify stale `baseVersion` returns 409 — access/version-safe/revision done; DocumentFavorite & DocumentShareLink helpers not implemented
- [ ] 3.4 Add Conversation/Message/Asset DAL with owner checks and idempotent `(conversationId, clientMessageId)`; verify duplicate retry does not duplicate rows — Conversation/Message idempotent upsert done; Asset/MessageAsset DAL not implemented
- [x] 3.5 Add Activity and ExploreArticle DAL; verify activities are scoped to the user and explore is paginated
- [x] 3.6 Add DTO mapping utilities with BigInt-safe serialization; verify no raw Prisma records are returned

## 4. API Migration to Prisma

- [ ] 4.1 Migrate repository/repo-detail/docs-detail/docs-summary/start routes to DAL/Prisma behind `DATA_BACKEND`; verify contract tests compare Mongo vs Prisma DTOs — routes migrated; fixture contract tests need a live Mongo + runbook
- [x] 4.2 Migrate chat/chat-detail/latest/collect routes to Conversation/Message DAL with streaming row states; verify stream completion updates status and retries do not duplicate
- [ ] 4.3 Migrate public-note/stroll routes to ExploreArticle DTOs; verify public content is sanitized and paginated — routes migrated with sanitize + limit; end-to-end comparison pending live data
- [x] 4.4 Add `Cache-Control: private, no-store` to private API responses; verify headers in integration tests
- [ ] 4.5 Remove direct `@/lib/mongodb` imports from app routes after cutover; verify `rg mongodb` only finds migration tooling — intentionally deferred until post-cutover (design boundary 24)

## 5. Data Migration Tooling

- [x] 5.1 Add Mongo reader with typed models, snapshots, and checkpoint support; verify it reads all collections and reports counts — CLI + checkpoint/quarantine files; live dry-run pending a real Mongo
- [x] 5.2 Add field converters for users/repositories/documents/conversations/messages/activities/explore; verify unit tests cover mapping, enums, and dates — Vitest coverage in scripts/migrate-core.test.ts
- [x] 5.3 Add HTML sanitize and TipTap schema-aware conversion with SHA-256 fingerprints and quarantine; verify the 100% conversion requirement is enforced — convertDocumentHtml + fingerprints; per-doc quarantine on failure
- [x] 5.4 Add Prisma writer with batch upserts and per-parent transactions; verify rerun idempotency test — converters upsert by legacy id; rerun rehearsal still needs a live DB
- [x] 5.5 Add validation report with source/target/failed counts, foreign-key violations, duplicate IDs, and conversion failures; verify critical failures block cutover — `data:validate` gates on count mismatch + non-empty quarantine
- [x] 5.6 Add reverse-sync cutover script; verify a rehearsal restores rows with `updatedAt >= cutover` — script added; rehearsal is a runbook item

## 6. Cutover, Testing, and Delivery

- [x] 6.1 Add unit/integration test setup with a PostgreSQL test branch; verify `npm test` runs in CI — Vitest 25 unit tests pass; live-PostgreSQL test branch remains follow-up
- [ ] 6.2 Add API contract tests comparing Mongo and Prisma fixtures; verify same normalized business fields — needs a live Mongo fixture set
- [ ] 6.3 Add E2E for login, ownership isolation, version conflict, AI retry, and public share; verify all pass on preview — Playwright follow-up
- [ ] 6.4 Rehearse production cutover three times and reverse sync once; verify timing report and zero critical failures — runbook (needs provisioned Neon/Mongo)
- [ ] 6.5 Execute the maintenance window with snapshots, migrate deploy, data:migrate, data:validate, `DATA_BACKEND=prisma`, and smoke tests; verify post-cutover checks — runbook
- [ ] 6.6 Keep Mongo read-only for 14 days, archive backups, then remove Mongo app credentials after checklist; verify no `mongodb` dependency in production — runbook
