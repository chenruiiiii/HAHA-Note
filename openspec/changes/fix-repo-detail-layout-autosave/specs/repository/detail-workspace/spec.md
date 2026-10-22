## Purpose

Defines the knowledge-base detail workspace behavior: the sidebar and document area fill the available viewport, each scroll region is bounded independently, loading states occupy their parent containers, and document edits persist automatically without disrupting manual save feedback.

## ADDED Requirements

### Requirement: Workspace fills the available parent container

The repository detail workspace SHALL size its sidebar and content pane to the full available height and width without overflowing the application content container. Loading states for the workspace and sidebar SHALL render within the same full-size layout shells as their loaded states.

#### Scenario: Workspace loading fills both panes
- **WHEN** the repository detail route is loading
- **THEN** the sidebar placeholder and the right content loading indicator each fill their respective parent panes

#### Scenario: Loaded workspace remains bounded
- **WHEN** the repository detail page has loaded at any supported viewport size
- **THEN** the sidebar and right content pane fill the parent without creating a document-level scrollbar or overflowing horizontally

#### Scenario: Sidebar loading preserves sidebar width
- **WHEN** the repository sidebar data is still loading
- **THEN** the loading placeholder occupies the fixed sidebar width and the full available height instead of collapsing the sidebar

### Requirement: Sidebar and editor use independent scroll regions

The repository sidebar SHALL remain fixed while the document list scrolls inside the sidebar. In the document view, the editor header and toolbar SHALL remain fixed while the summary and document body scroll together inside the content pane.

#### Scenario: Sidebar list scrolls independently
- **WHEN** the document list is longer than the sidebar viewport
- **THEN** only the document list scrolls and the sidebar header and navigation remain fixed

#### Scenario: Editor content scrolls below fixed controls
- **WHEN** the document body is longer than the available content height
- **THEN** the summary and document body scroll within the content pane while the editor header and toolbar remain visible

#### Scenario: Page scroll does not move the workspace
- **WHEN** the user scrolls inside the document list or editor content
- **THEN** the outer application shell does not scroll or shift

### Requirement: Repository detail layout is responsive

Repository detail views SHALL adapt to narrow viewports without fixed-width content forcing horizontal overflow.

#### Scenario: Narrow viewport keeps content within its pane
- **WHEN** the viewport is narrower than the repository card's preferred width
- **THEN** the card and its controls shrink to the available width and remain fully visible

#### Scenario: Editor controls remain usable at narrow widths
- **WHEN** the editor is rendered in a narrow content pane
- **THEN** its header and toolbar fit the pane and the editor outline is hidden when there is insufficient horizontal space

### Requirement: Document edits autosave after inactivity

The editor SHALL save document title and content after three seconds without further edits. Every title or content change SHALL restart the three-second timer, and an autosave SHALL not display a success message.

#### Scenario: Edit triggers autosave
- **WHEN** the user changes the document title or body and then makes no further edits for three seconds
- **THEN** the editor sends one save request containing the latest title and content

#### Scenario: Continued editing postpones autosave
- **WHEN** the user makes another edit before the three-second timer elapses
- **THEN** the pending save is postponed until three seconds after the latest edit

#### Scenario: Autosave completes silently
- **WHEN** an automatic save succeeds
- **THEN** the editor updates its save status without showing a success toast

#### Scenario: Autosave failure does not interrupt editing
- **WHEN** an automatic save fails
- **THEN** the editor remains editable and exposes a failed save status without showing a success message

### Requirement: Manual save is immediate and gives global feedback

Pressing Ctrl+S or Cmd+S SHALL cancel any pending automatic save and immediately save the current document. The page SHALL use the application's global message utility to report success or failure.

#### Scenario: Manual save succeeds
- **WHEN** the user presses Ctrl+S or Cmd+S and the save request succeeds
- **THEN** the pending autosave is cancelled, the save completes immediately, and a global success message is shown

#### Scenario: Manual save fails
- **WHEN** the user presses Ctrl+S or Cmd+S and the save request fails or returns a non-success business code
- **THEN** a global error message is shown and the editor keeps the unsaved content

#### Scenario: Manual save does not duplicate a pending autosave
- **WHEN** a manual save starts while an automatic save is pending
- **THEN** only the immediate manual save is sent for that edit revision

### Requirement: Save requests honor business response status

The document save flow SHALL treat a response as successful only when the API business code indicates success. Non-success codes SHALL be surfaced as save failures even when the HTTP request itself completes.

#### Scenario: Business error is treated as failure
- **WHEN** the save API responds with a non-success business code
- **THEN** the save status remains failed and manual saves show a global error message
