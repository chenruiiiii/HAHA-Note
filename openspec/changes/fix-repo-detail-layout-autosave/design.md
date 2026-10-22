## Context

See `proposal.md` for motivation and `specs/repository/detail-workspace/spec.md` for behavior.

The route already sits inside a viewport-height application layout whose content container has `overflow: hidden`. The repository shell uses flex, but its children do not consistently opt into shrinkable flex tracks. `RepoSide` returns a bare skeleton while loading, so it does not occupy the sidebar shell. `HAEditor` uses viewport-height minimums and sticky header/toolbar rules that assume the page itself scrolls. Saving is triggered only by title blur, the toolbar button, Ctrl/Cmd+S, and page lifecycle handlers; there is no inactivity timer.

## Goals / Non-Goals

**Goals:**
- Make the repository workspace a self-contained full-height layout with one fixed sidebar and one fixed editor control area.
- Keep all long content inside explicit scroll containers.
- Make loading states use the same geometry as loaded states.
- Centralize three-second autosave timing and manual-save cancellation in `HAEditor`.
- Keep save request and global feedback responsibilities in the document page.

**Non-Goals:**
- Reworking the global application shell or sidebar.
- Adding a new persistence API, offline queue, version conflict UI, or collaborative editing.
- Changing document summary generation timing.
- Replacing the existing editor or TipTap extensions.

## Decisions

### Use a bounded flex workspace with explicit `min-*: 0`

`.repo-detail` becomes `min-width: 0; min-height: 0; overflow: hidden`. The sidebar is a fixed `flex: 0 0 300px` track, and the right `Content` is `flex: 1 1 auto; min-width: 0; min-height: 0; overflow: hidden`. This prevents flex children from using intrinsic content width/height and pushing the route outside the app viewport.

Alternative: keep the existing `max-width: 300px` and add overflow at page level. Rejected because it still lets content define the flex track and creates a second document scrollbar.

### Keep sidebar header/navigation static and scroll only the list

`RepoSide` becomes a full-height column. The header and menu are non-shrinking blocks; `.repo-list-section` gets `flex: 1; min-height: 0; overflow: hidden`; `.repo-items` gets `min-height: 0; overflow-y: auto`. Loading renders the same `<aside>` shell with an inner skeleton, preserving width and height.

Alternative: make the entire aside scroll. Rejected because the requirement explicitly keeps the sidebar fixed and scrolls only its list.

### Scroll summary and body together below fixed editor controls

`.file-detail` and `.ha-editor` fill their parent (`height: 100%; min-height: 0`) and use a column layout with `overflow: hidden`. Header and toolbar are non-scrolling flex items; `.ha-editor-shell` takes `flex: 1; min-height: 0; overflow-y: auto`. The outline stays inside the shell and is sticky relative to that scroll container. This makes the summary and document body share one scrollbar while the controls remain visible.

Alternative: keep sticky header/toolbar and scroll `.file-detail`. Rejected because sticky positioning would be relative to the outer page and can leave gaps or duplicate scroll contexts.

### Put debounce timing in `HAEditor`, request work in the page

`HAEditor` owns a three-second timer because it observes both title and content edits. A title or body change resets the timer. The timer calls `onSave(payload, { reason: 'auto' })`. Ctrl/Cmd+S and the toolbar save button cancel the timer and call `onSave(..., { reason: 'manual' })`; title submit keeps the pending autosave so blur followed by a save-button click does not submit the same revision twice. The page performs `updateDocsDetailData`, checks `response.code`, and only shows `successMessage`/`errorMessage` for manual saves. Autosave failures update the editor status silently.

Alternative: debounce in the page. Rejected because the page receives separate title/content callbacks and would need to duplicate timer logic and coordinate with editor status. `HAEditor` already owns save status and the keyboard shortcut.

### Keep page lifecycle flush as a safety net

The existing `pagehide`/`beforeunload` keepalive flush remains. A successful normal save clears the dirty flag, so the safety net does not send a duplicate request. The autosave timer is cleared on unmount and before manual save.

Alternative: rely solely on autosave. Rejected because closing the tab during the three-second window would lose the latest edit.

### Preserve API shape and add a reason option

`onSave` gains an optional second argument rather than a new service endpoint. The page checks `response.code === 200`; non-success responses throw with the API message so `HAEditor` can retain content and expose failure state. No dependency or database changes are needed.

## Risks / Trade-offs

- [Nested scroll containers can be hard to operate with a mouse] -> Use clear `overflow-y: auto` only on the list and editor shell, keep outer containers `overflow: hidden`, and avoid fixed heights on inner cards.
- [Autosave may race with a manual save] -> Cancel the pending timer before manual save and keep the existing single in-flight guard; the latest edit remains in refs and the safety-net flush still covers navigation.
- [Title blur could produce an unwanted success toast] -> Route title submit through the silent immediate save path; reserve global manual feedback for Ctrl/Cmd+S and the explicit save button.
- [Global editor styles affect public preview] -> Scope the new height/scroll behavior to the editable repository workspace or ensure preview still uses its own container rules.
- [Business error codes may vary] -> Treat only the documented success code as success and use the response message when available.

## Migration Plan

1. Apply layout and loading shell changes; verify `/repo-detail/:id/home` and a document route at desktop and narrow widths.
2. Add editor timer, manual save reason, and global message handling; verify autosave, Ctrl/Cmd+S, title blur, and navigation flush.
3. Run OpenSpec validation, lint, focused tests, and a production build.
4. Rollback is limited to reverting the CSS/layout and `HAEditor`/document-page save changes; no data migration is required.
