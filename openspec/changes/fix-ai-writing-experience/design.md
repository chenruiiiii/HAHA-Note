## Context

See `proposal.md - Why`. The current implementation has four boundaries that shape the fix:

- Prisma stores `MessageRole` as uppercase enum values, while legacy MongoDB documents use lowercase role strings.
- AI SDK `status` and Redux `requestStatus` are written by separate callbacks; terminal UI must not let the `ready` transition overwrite an error that was just recorded.
- Chat input currently sends plain text through `useHaChat`, so attachments need a text-context handoff rather than a new message schema.
- `/api/chat-detail` is a streaming POST endpoint and must not be cached; the model list is served by `/api/ai-models`.

## Goals / Non-Goals

**Goals:**

- Normalize persisted roles at the DAL boundary so every consumer receives one role vocabulary.
- Make stream completion idempotent and preserve error/abort terminal states.
- Parse supported attachments on the server and send only extracted text through the existing chat contract.
- Make title generation observable by refreshing detail after persistence.
- Cache the model list in a module-level client store with in-flight request deduplication.

**Non-Goals:**

- No new attachment table, object storage, OCR, image extraction, or client-side document parsing.
- No change to the AI SDK streaming protocol or persisted message-part schema.
- No caching of `/api/chat-detail` or of chat responses.
- No broad redesign of the chat page.

## Decisions

### Role normalization at the persistence boundary

Normalize with `String(role).toLowerCase()` and map only `assistant` and `system` explicitly; everything else becomes `user`. This preserves the existing `AiMissionMessage` contract and works for both Prisma uppercase values and legacy lowercase values. Alternative: branch on `MessageRole` enum only; rejected because it would break legacy data.

### Terminal stream state is derived once, with error precedence

Keep `onFinish` as the authoritative terminal writer. Add a guard that treats the SDK `ready` transition as a completion signal only when the current request is still active and the Redux state is not already `error`/`aborted`. On `ready`, immediately clear the posting indicator and streaming styling; never overwrite a terminal error. Alternative: make `status` the sole state source; rejected because the hook also supports retry, abort, and error states that need explicit Redux transitions.

### Copy action is icon-only

Render only `CopyOutlined` inside the existing button and wrap it with Ant Design `Tooltip title="复制"`. Align the answer content and metadata by using the same left content inset rather than adding a second visual offset.

### Attachments are parsed on the server

Use a dedicated `POST /api/chat-attachments` route:

- Authenticate with `requireUser` when the Prisma backend is active.
- Accept one `FormData` file per request.
- Allow `.txt`, `.md`, `.docx`, `.doc`, and `.pdf`; reject unsupported extensions before parsing.
- Enforce 10 MB and 50,000 extracted characters.
- Decode text formats as UTF-8, parse DOCX with `mammoth`, DOC with `word-extractor`, and PDF with `unpdf`.
- Return `{ fileName, extension, text, truncated }` with a readable JSON error on failure.

The client owns file selection, parsing state, removal, and composing the outgoing message. The extracted text is appended under a clear attachment marker in the existing text message, so no schema migration or chat-stream change is needed. Alternative: parse in the browser; rejected because PDF/DOCX/DOC parsing increases bundle size, exposes parser edge cases to every client, and makes consistent size/error enforcement harder.

### Title generation uses a shared default-title predicate

Use one predicate covering absent titles and `新对话`, `新建对话`, and `新建文档`. The first response remains persisted immediately; title/summary generation then runs in the existing `onFinish` flow. The client refreshes detail after persistence, and the header updates from the returned title. Alternative: generate a title from the first user text synchronously; rejected because it is not the existing AI title-generation behavior and produces lower-quality titles.

### Model cache is client-side with a five-minute TTL

Add a module-level cache plus an in-flight promise in a small hook. The server keeps its existing short process cache and returns `Cache-Control: public, max-age=60, stale-while-revalidate=300`. Chat input uses the hook and falls back to the default model on failure. Alternative: only rely on HTTP cache; rejected because browser cache behavior varies and does not deduplicate concurrent component mounts predictably.

## Risks / Trade-offs

- [Large or malformed documents can exhaust memory or CPU] → enforce size and extracted-text limits, parse server-side, and return bounded errors.
- [Serverless runtime may not support a parser dependency] → pin server-compatible packages, mark them external where needed, and validate the route build.
- [Attachment text in the message can be long] → truncate at 50,000 characters and show a truncation notice in the UI.
- [`ready` can arrive after an error callback] → terminal-state guard with error/abort precedence.
- [Cached model list can be stale after an environment change] → five-minute client TTL plus one-minute server cache; input remains usable during failure.
- [Title generation adds latency after the stream] → keep it in `onFinish` and refresh the header asynchronously; never block the stream response on title generation.

## Migration Plan

1. Deploy the role normalization and stream/UI fixes; no data migration is needed.
2. Deploy the attachment route and parser dependencies, then enable the input picker.
3. Deploy title and model-cache changes; verify an existing conversation and a newly created conversation.
4. Rollback by reverting the branch; the existing chat contract and data remain compatible.

## Open Questions

None. The remaining choices are implementation details covered by the tasks.
