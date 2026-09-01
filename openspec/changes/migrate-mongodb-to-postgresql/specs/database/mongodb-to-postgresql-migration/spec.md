## Purpose

Defines the one-time, auditable, idempotent migration path from MongoDB to PostgreSQL, including content conversion, validation, maintenance-window cutover, and rollback.

## ADDED Requirements

### Requirement: Idempotent batch migration
The migration tool SHALL be re-runnable, SHALL upsert rows by preserved legacy ID, SHALL process entities in bounded batches, SHALL write checkpoints containing only IDs and status, and SHALL produce per-batch read/success/skip/failure counts. Re-running SHALL NOT duplicate rows.

#### Scenario: Resume after partial failure
- **WHEN** migration fails midway and is re-run with `--execute`
- **THEN** previously completed rows are not duplicated and only missing rows are processed

### Requirement: Conservative quarantine
The migration SHALL quarantine unknown structures, orphan relationships, invalid dates, duplicate legacy IDs, and HTML conversion failures instead of silently dropping them. Skipped rows SHALL be listed in the migration report with a reason.

#### Scenario: Orphan activity skipped
- **WHEN** an activity references a document that does not exist in MongoDB
- **THEN** the activity is not migrated as a formal Activity row and is reported as orphan

### Requirement: Fidelity-preserving HTML conversion
The migration SHALL sanitize content HTML, convert it to TipTap JSON with the same schema-aware parser and extensions used by the editor, derive contentText, and compute SHA-256 fingerprints of input and output. Regex-based HTML parsing is forbidden. Production cutover SHALL require 100% parseable conversion or an explicit human-confirmed exception.

#### Scenario: Unsupported markup blocks cutover
- **WHEN** a production document's HTML cannot be converted by the editor's parser
- **THEN** the document is quarantined and the cutover validation fails with a conversion error count above zero

### Requirement: Source and target mapping
The migration SHALL preserve MongoDB `_id` values as PostgreSQL `id`, map Repository.docs_list and details with reconciliation, split AI conversation types into Conversation and Message rows, map favorites and activity types, and convert `isPublic`/`isCollect` into visibility and favorite relations.

#### Scenario: Missing detail entry reconciled
- **WHEN** `docs_list` references a document missing from `docs_detail`
- **THEN** migration creates a DRAFT document and marks `MISSING_DETAIL` in the report

### Requirement: Validation gate
The migration SHALL generate a validation report with source/target/failed counts per entity, foreign-key violations, duplicate legacy IDs, and conversion failures. Before production cutover, critical failures SHALL be zero.

#### Scenario: Mismatched counts block cutover
- **WHEN** validation reports any nonzero critical failure count
- **THEN** the cutover procedure SHALL stop and SHALL NOT switch `DATA_BACKEND` to prisma

### Requirement: Switchable backend and rollback
The system SHALL support `DATA_BACKEND=mongodb|prisma`; rollback before cutover SHALL return to MongoDB because it has no new writes; rollback after PostgreSQL writes SHALL run a reverse-sync script from the cutover timestamp and SHALL only proceed when reverse sync has been rehearsed and validated.

#### Scenario: Post-cutover rollback preserves new writes
- **WHEN** a rollback is needed after production writes have been written to PostgreSQL
- **THEN** reverse sync synchronizes rows changed at or after the cutover timestamp back to MongoDB before switching the application

### Requirement: Retention and credential cleanup
MongoDB SHALL remain read-only for at least 14 days after cutover, backups SHALL be archived to restricted storage outside the repository, and MongoDB application credentials SHALL be removed only after a written checklist confirms no rollback need.

#### Scenario: Credentials remain until checklist
- **WHEN** fewer than 14 days have passed or the checklist has not been signed
- **THEN** the MongoDB application credentials remain unavailable for removal and the database connection string is not committed to Git
