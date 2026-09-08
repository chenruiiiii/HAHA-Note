# AI Chat SDK Hardening V1 Tasks

1. Add snapshot hydration merge utility.
2. Update AI chat reload path to merge instead of replace.
3. Add `chatId` to chat-message, stop-send-message, start-streaming, and quit-streaming events.
4. Scope PostingBox to the current chat instance.
5. Keep redux state keyed by `chatId` and clear only the current session on unmount.
6. Keep request validation and abort handling in the route.
7. Verify manual retry, disconnect retry, and old conversation compatibility.
