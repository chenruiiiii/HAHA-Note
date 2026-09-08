# AI Chat SDK Hardening V1

## Why

The current AI chat flow is usable, but it still has hardening gaps:

- snapshot hydration can overwrite newer streamed text
- chat UI events are global and can cross-talk across chat instances
- request state is easier to corrupt when multiple callbacks write the same slice
- abort, disconnect, and business errors should not share the same behavior
- duplicate submits and persisted errors should not create inconsistent state

## What Changes

- Scope chat runtime state by `chatId`
- Keep stream lifecycle state separate from posting/loading UI state
- Merge server snapshots into live messages without text regression
- Filter mitt events by `chatId`
- Treat abort as a real stop, disconnect as limited retry, and business errors as manual retry
- Validate request payloads at the route boundary
- Keep persisted messages backward-compatible with existing MongoDB data

## Non-Goals

- No migration to a custom SSE protocol in this change
- No AI model switch UI
- No authentication / rate-limiting rollout
- No PostgreSQL migration
- No visual redesign of the chat page

## Success Criteria

- A stale snapshot never shortens an already longer assistant response
- Multiple chat instances do not stop or start each other
- Manual retry does not duplicate the user message
- Abort ends the current run and does not persist half-finished assistant content
- Invalid requests return 400 JSON with a readable message
- Existing conversations still render
