# AI Chat SDK Hardening V1 Spec Delta

## Added Requirements

### Requirement: Chat State Is Scoped By Chat ID

The AI chat runtime SHALL keep request state keyed by `chatId`.

#### Scenario: Two chat pages are open

- **WHEN** one chat page starts streaming
- **THEN** only that `chatId` state SHALL change
- **AND** another chat instance SHALL keep its own state

### Requirement: Snapshot Hydration Must Not Regress Text

The AI chat page SHALL merge the persisted snapshot into the live message list.

#### Scenario: Persisted snapshot is shorter

- **GIVEN** the live assistant message text is longer than the persisted snapshot prefix
- **WHEN** the page reloads or revalidates
- **THEN** the live longer text SHALL be preserved
- **AND** the snapshot MAY only fill missing messages or metadata

### Requirement: Event Bus Messages Are Chat-Scoped

The UI event bus SHALL carry `chatId` for chat start, stop, and message events.

#### Scenario: Multiple chat instances exist

- **WHEN** one instance emits `start-streaming`
- **THEN** only the matching chat instance SHALL react

### Requirement: Abort Is Terminal

The chat route SHALL propagate abort to the upstream model request.

#### Scenario: User clicks stop

- **WHEN** the user stops generation
- **THEN** the active stream SHALL end
- **AND** half-finished assistant text SHALL NOT be persisted as a final answer

### Requirement: Retry Rules Are Split

The runtime SHALL retry only transport disconnects automatically.

#### Scenario: Business error occurs

- **WHEN** the provider returns a non-disconnect error
- **THEN** the UI SHALL show manual retry only
- **AND** the runtime SHALL NOT auto-retry

### Requirement: Old Conversations Stay Readable

The read path SHALL continue to support documents that only contain the legacy `types` array.

#### Scenario: Legacy conversation is opened

- **GIVEN** an old MongoDB document with no new hardening fields
- **WHEN** the user opens the chat
- **THEN** the conversation SHALL render normally
