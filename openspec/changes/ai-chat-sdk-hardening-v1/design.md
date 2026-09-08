# AI Chat SDK Hardening V1 Design

## Current Problem

The current page reload path reads persisted chat detail and replaces the live messages directly. If the persisted snapshot lags behind the active stream, the UI can regress from a longer assistant message to a shorter prefix.

## Target Flow

```text
Input / URL payload
  -> chatId-scoped send
  -> useChat stream
  -> status + onFinish + onError
  -> chatId-scoped redux state
  -> persisted chat detail
  -> snapshot merge on reload
```

## Merge Rule

For the same `message.id`:

- keep the longer text when snapshot is only a shorter prefix
- accept the newer snapshot when it is longer and contains the current prefix
- keep live message order stable
- append new snapshot-only messages

This is the guardrail that prevents rollback.

## Event Boundary

`mitt` remains in use for now, but every event carries `chatId`:

- `chat-message`
- `stop-send-message`
- `start-streaming`
- `quit-streaming`

Receivers ignore events for other chat ids.

## State Boundary

`chat` redux state is keyed by `chatId`:

- `byId[chatId]` stores request status, retry count, posting flag, and last error
- `currentChatId` tracks the active conversation across the home-to-chat transition
- unmount only clears the current `chatId`

## Error Boundary

- JSON validation or initialization failure returns HTTP 400 / 500 JSON directly
- `isDisconnect` can retry up to 2 times
- `isError` shows manual retry only
- `isAbort` is terminal and not counted as a retry

## Persistence Boundary

Persisted conversation detail stays backward-compatible:

- old documents with only `types` still load
- new fields remain optional
- abort does not promote half-finished assistant text to a final answer
