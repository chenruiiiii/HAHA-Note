## Purpose

Define the user-visible behavior of the AI writing experience, including conversation history, streaming completion, attachments, title generation, and model selection performance.

## ADDED Requirements

### Requirement: Historical message roles preserve their original speaker

The system SHALL map persisted message roles case-insensitively so assistant and system messages remain assistant and system messages when an existing conversation is reopened. Unknown or missing roles MUST fall back to user without changing message order or content.

#### Scenario: Reopen a Prisma-backed conversation
- **WHEN** a conversation contains messages persisted with the uppercase `ASSISTANT`, `SYSTEM`, and `USER` role values
- **THEN** the detail response returns `assistant`, `system`, and `user` respectively
- **THEN** the reopened conversation visually distinguishes AI replies from user questions

#### Scenario: Reopen a legacy lowercase conversation
- **WHEN** a legacy conversation contains lowercase `assistant`, `system`, or `user` role values
- **THEN** each role is preserved using the same normalized output
- **THEN** no historical message is reclassified as a user message solely because of role casing

### Requirement: Reply controls and streaming state match the final response state

The system SHALL show only a copy icon for message copy actions, with the label provided by a tooltip. When the AI stream reaches its terminal `ready` state, the system MUST immediately remove the in-progress reply indicator and reply styling without replacing a terminal error state. AI response content MUST share the same left content boundary as its copy control.

#### Scenario: Copy an AI response
- **WHEN** the user hovers or focuses the copy control
- **THEN** a tooltip communicates that the action copies the message
- **THEN** no persistent “复制” text is rendered beside the icon

#### Scenario: AI response finishes normally
- **WHEN** the AI SDK status becomes `ready` after a successful stream
- **THEN** the posting/reply-in-progress indicator is removed
- **THEN** the final AI response is rendered without streaming-only decoration

#### Scenario: Stream ends in error
- **WHEN** the stream reaches `ready` after an error or disconnect terminal state
- **THEN** the system keeps the error state and retry affordance
- **THEN** the system does not overwrite the error with a success state

#### Scenario: Align AI response content
- **WHEN** an AI response is rendered with its copy control
- **THEN** the left edge of the response content aligns with the left edge of the copy icon

### Requirement: Users can attach supported documents to an AI message

The system SHALL allow users to attach `.txt`, `.md`, `.docx`, `.doc`, and `.pdf` files from the chat input. Supported documents MUST be parsed on the server before sending, with a maximum file size of 10 MB and a maximum extracted-text length of 50,000 characters. The system MUST show parsing progress and reject unsupported, oversized, empty, or unreadable files with a user-readable message.

#### Scenario: Attach a supported document
- **WHEN** the user selects a supported file within the size limit
- **THEN** the client uploads it to the attachment endpoint
- **THEN** the parsed text and file name are attached to the next outgoing message
- **THEN** the user can remove the attachment before sending

#### Scenario: Send an attachment without typed text
- **WHEN** at least one attachment is ready and the textarea is empty
- **THEN** the send action remains enabled
- **THEN** the outgoing message includes the attachment context

#### Scenario: Reject an unsupported or oversized file
- **WHEN** the selected file has an unsupported extension or exceeds 10 MB
- **THEN** no parsing request is sent
- **THEN** the user receives a clear warning or error message

#### Scenario: Parse a document with no extractable text
- **WHEN** the server cannot extract non-empty text from a supported document
- **THEN** the attachment is not added as ready
- **THEN** the user receives a readable failure message

### Requirement: New conversations receive a generated title

The system SHALL generate and persist a conversation title after the first successful AI response when the stored title is absent or is one of the known default placeholders. The refreshed title MUST become visible in the conversation header without requiring a full page reload.

#### Scenario: Generate a title for a new Prisma conversation
- **WHEN** the first AI response completes for a conversation whose title is `新对话`, `新建对话`, or `新建文档`
- **THEN** the server generates a title from the first user/assistant exchange
- **THEN** the generated title is persisted and returned by the next detail refresh
- **THEN** the conversation header displays the generated title

#### Scenario: Preserve a user-visible custom title
- **WHEN** a conversation already has a non-default title
- **THEN** a later AI response does not regenerate or overwrite that title

### Requirement: Available models are cached on the client

The system SHALL cache the available model list for five minutes and SHALL deduplicate concurrent requests from multiple chat input instances. The cache MUST NOT apply to the streaming chat endpoint. A failed model request MUST NOT block message input or sending.

#### Scenario: Reopen chat input within the cache window
- **WHEN** the model list was fetched successfully less than five minutes ago
- **THEN** a newly mounted chat input uses the cached list without issuing another request

#### Scenario: Concurrent chat inputs request models
- **WHEN** multiple chat inputs mount while no model cache exists
- **THEN** the client shares one in-flight model request
- **THEN** all inputs receive the same result

#### Scenario: Model request fails
- **WHEN** the model list request fails or is still pending
- **THEN** the input remains usable with a default model fallback
- **THEN** no chat stream request is cached or replayed

### Requirement: AI writing fixes preserve existing conversation compatibility

The system SHALL preserve existing conversation IDs, message ordering, persisted message parts, and the `/api/chat-detail` streaming contract while applying these fixes.

#### Scenario: Existing conversation remains readable
- **WHEN** an existing conversation is reopened after the change
- **THEN** its messages render in the original order with their original text
- **THEN** no migration or manual repair is required for role values
