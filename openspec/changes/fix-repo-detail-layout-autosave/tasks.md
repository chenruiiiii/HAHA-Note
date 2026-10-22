## 1. Workspace and loading layout

- [x] 1.1 Update `app/repo-detail/layout.tsx` and `app/repo-detail/style.scss` so the sidebar is a fixed flex track and the right content is a shrinkable full-height pane with `min-width: 0`, `min-height: 0`, and `overflow: hidden`; verify the route no longer creates an outer scrollbar
- [x] 1.2 Update `app/repo-detail/loading.tsx` to render full-size sidebar and content loading shells; verify both placeholders fill their parent panes while the route is loading
- [x] 1.3 Update `RepoSide` loading state to render the same `<aside>` shell with an inner skeleton; verify the sidebar keeps its width and height before data arrives

## 2. Independent scroll regions

- [x] 2.1 Update `RepoSide` styles so the header and menu stay fixed while only `.repo-items` scrolls; verify a long document list scrolls without moving the sidebar header or page
- [x] 2.2 Update the document page and `HAEditor` styles so `.file-detail` and `.ha-editor` fill their parent, header/toolbar stay fixed, and only `.ha-editor-shell` scrolls; verify the summary and body share one scrollbar while controls remain visible

## 3. Responsive repository views

- [x] 3.1 Remove fixed minimum-width overflow from `RepoDetailHome` and adjust narrow-screen rules; verify the card and controls fit at 480px, 768px, and desktop widths
- [x] 3.2 Verify the editor outline hides at the existing narrow breakpoint and the toolbar remains horizontally usable without widening the content pane

## 4. Autosave and manual save behavior

- [x] 4.1 Extend the `HAEditor` save callback contract with a `manual | auto` reason and add a three-second debounce that restarts on title or content changes; verify one autosave request is sent after inactivity
- [x] 4.2 Cancel the pending timer on Ctrl/Cmd+S, toolbar save, and unmount; title submit restarts the inactivity window so blur followed by a manual save does not duplicate the request
- [x] 4.3 Update the document page save handler to check `response.code === 200`, use `successMessage`/`errorMessage` for manual saves, and remain silent for autosave feedback; verify non-success business codes surface as failures
- [x] 4.4 Preserve the existing `pagehide`/`beforeunload` keepalive flush and confirm a successful save clears the dirty flag so navigation does not send a duplicate request

## 5. Verification and delivery

- [x] 5.1 Run `pnpm exec openspec validate fix-repo-detail-layout-autosave --strict` and fix any planning or delta-spec errors
- [x] 5.2 Run ESLint on changed files and the relevant test suite; ESLint passes with only the existing `RepoSide` image warning, Vitest reports 26 passed and 3 pre-existing `scripts/migrate-core.test.ts` mock failures unrelated to this change
- [x] 5.3 Run a production build or the closest available type/build check and verify the repository detail route compiles; `pnpm build` compiles the route but the existing sitemap prerender step fails on Prisma `EACCES` in this environment
- [x] 5.4 Review the diff for scope, confirm no `master` merge occurs, and prepare the branch commit and push
