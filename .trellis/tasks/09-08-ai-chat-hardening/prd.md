# AI Chat Stable Recovery & Hardening

## Goal

Harden HAHA-Note AI chat so it behaves like a real conversation system instead of a fragile streaming demo. The page must survive refresh, disconnect, retry, and slow persistence without regressing visible text or cross-talking across chat instances.

## Requirements

- Chat runtime state must be scoped by `chatId`.
- Snapshot hydration must not overwrite longer live streamed text with a shorter persisted prefix.
- UI events for chat start/stop/message must be chat-scoped.
- Abort must terminate the active run and must not persist half-finished assistant output as final.
- Automatic retry applies only to transport disconnects.
- Invalid request payloads must return a readable 400 JSON response.
- Existing MongoDB conversations must remain readable.

## Acceptance Criteria

- [ ] Opening two chats does not make them stop or start each other.
- [ ] Reloading during stream does not shorten an already longer assistant message.
- [ ] Stop ends the current run and does not store half-finished assistant output as the final answer.
- [ ] Disconnect can retry automatically with the configured limit; business errors require manual retry.
- [ ] Legacy conversations with only `types` still render.
