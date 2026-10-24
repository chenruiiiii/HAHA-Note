## 1. Planning and dependencies

- [x] 1.1 Add server-side DOCX/DOC/PDF parser dependencies and verify `pnpm install` completes without peer-dependency errors
- [x] 1.2 Mark parser packages as server-only externals where required and verify `pnpm build` can resolve the attachment route

## 2. Conversation history and stream state

- [x] 2.1 Normalize persisted roles case-insensitively in `src/server/dal/conversations.ts` and verify a Prisma-style uppercase assistant message maps to `assistant`
- [x] 2.2 Preserve legacy lowercase roles and verify the normalization behavior with a focused unit test or a small DAL regression test
- [x] 2.3 Make the AI SDK `ready` transition clear posting/streaming UI while preserving `error` and `aborted` terminal states, and verify the state precedence in a focused test or manual state check
- [x] 2.4 Remove the visible “复制” label, add a `复制` tooltip, and verify the copy action still writes the message text to the clipboard
- [x] 2.5 Align AI response content with the copy icon's left edge and verify at desktop and narrow viewport widths

## 3. Attachment parsing backend

- [x] 3.1 Create `app/api/chat-attachments/route.ts` with authentication, extension allowlist, 10 MB size limit, and readable JSON errors
- [x] 3.2 Implement `.txt`/`.md` UTF-8 extraction and verify Chinese text survives round-trip parsing
- [x] 3.3 Implement `.docx`, `.doc`, and `.pdf` extraction with a 50,000-character cap and verify each supported extension with a sample file
- [x] 3.4 Verify unsupported extensions, oversized files, empty documents, and parser failures do not create a ready attachment

## 4. Attachment input experience

- [x] 4.1 Add a hidden file input triggered by the plus button and verify the picker only offers the supported extensions
- [x] 4.2 Upload selected files to the attachment endpoint, show parsing/ready/error states, and verify multiple selections do not block typing
- [x] 4.3 Allow ready attachments to be removed before sending and verify the outgoing message no longer contains removed text
- [x] 4.4 Compose attachment text into the existing message payload, allow attachment-only sends, and verify the message is persisted with its context
- [x] 4.5 Add responsive styling for attachment chips and verify the input remains usable at narrow widths

## 5. Title generation and model caching

- [x] 5.1 Unify default-title detection for `新对话`, `新建对话`, and `新建文档` in both Prisma and legacy persistence paths and verify each placeholder triggers generation
- [x] 5.2 Verify a custom title is not regenerated and a generated title appears in the chat header after the first response
- [x] 5.3 Add a module-level five-minute model cache with in-flight request deduplication and verify concurrent mounts share one request
- [x] 5.4 Add cache headers to `/api/ai-models`, keep `/api/chat-detail` uncached, and verify the input still falls back to the default model on failure

## 6. Verification

- [x] 6.1 Run `openspec validate "fix-ai-writing-experience" --strict` and resolve all validation errors
- [x] 6.2 Run targeted ESLint on changed files and fix all new warnings/errors
- [x] 6.3 Run the project test suite or the closest affected tests and record any pre-existing failures separately
- [x] 6.4 Manually verify reopening a historical conversation, a successful stream, an error stream, attachment-only sending, title refresh, and a cached model reload
- [x] 6.5 Commit the branch and push `codex/fix-ai-writing` to the `github` remote without merging it into `master`
