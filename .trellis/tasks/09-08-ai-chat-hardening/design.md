# AI Chat Stable Recovery & Hardening Design

## Design Summary

Keep the existing AI SDK chat flow, but harden the boundary between live stream state, persisted snapshots, and UI state.

```text
input -> chatId-scoped send -> useChat stream -> redux by chatId
     -> persisted detail -> merge hydration -> render
```

## Key Decisions

- Use `chatId` as the partition key for all runtime state.
- Keep `requestStatus` as the source of truth for posting / retry banners.
- Merge persisted snapshots into live messages rather than replacing them.
- Keep `mitt` only as a temporary bridge, but every event must carry `chatId`.
- Retry only disconnects automatically; manual retry covers business failures.
- Abort is terminal and should not promote half responses into final persisted answers.

## Boundary Rules

### Snapshot Merge

- Same message id can be updated, but visible text may not shrink.
- If persisted text is only a prefix of the live text, keep the live text.
- Missing messages from snapshot may still be appended.

### Events

- `chat-message`
- `stop-send-message`
- `start-streaming`
- `quit-streaming`

All four events must include `chatId`, and receivers must ignore mismatched ids.

### Server Errors

- Validation / initialization errors return JSON directly.
- Stream-time errors remain readable and do not leak stack traces.
- Abort is routed through `req.signal`.

## Rollback

All new hydration helpers and event payloads are additive. If needed, the old rendering path can be restored while keeping the merge utility.
