# AI Chat Stable Recovery & Hardening Implementation Plan

## 1. Formalize the Change

- [x] Create OpenSpec change `ai-chat-sdk-hardening-v1`.
- [x] Capture grill-me boundaries in the change docs.
- [ ] Review the change docs before implementation start.

## 2. Fix Snapshot Regression

- [x] Add snapshot hydration merge utility.
- [x] Update AI chat reload path to merge instead of replace.
- [ ] Manually verify a stale snapshot cannot shorten visible assistant text.

## 3. Isolate Chat Instances

- [x] Add `chatId` to the chat event bus payloads.
- [x] Scope `PostingBox` to the current chat instance.
- [ ] Verify two open chats do not receive each other’s start/stop events.

## 4. Keep Runtime State Scoped

- [x] Keep redux chat state keyed by `chatId`.
- [x] Keep current chat id for cross-page navigation.
- [ ] Verify unmount cleanup only clears the current chat session.

## 5. Preserve Abort and Retry Semantics

- [x] Route abort handling through `req.signal`.
- [x] Retry only on disconnect; business errors require manual retry.
- [ ] Verify stop ends the active run without persisting half-finished assistant text.

## 6. Validate and Verify

- [x] Keep request validation at the route boundary.
- [ ] `npm run lint`
- [ ] `npm run build`
- [ ] Manual multi-chat, refresh, stop, and retry checks
