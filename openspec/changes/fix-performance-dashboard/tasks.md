## 1. Dashboard presentation

- [x] 1.1 Update the dashboard layout styles for wrapping filters, responsive metric/chart grids, and contained table overflow.
- [x] 1.2 Remove rating and confidence from featured cards and summary table columns.
- [x] 1.3 Add a client-only ECharts component with resize/dispose lifecycle handling and reuse one chart instance across data updates.

## 2. Core metric charts

- [x] 2.1 Build LCP, INP, CLS, and AI first-token chart data from existing summary values and budgets, using an independent unit for each chart.
- [x] 2.2 Render the four chart cards in the dashboard with loading, empty-data, filter, and refresh handling.

## 3. Verification

- [x] 3.1 Run OpenSpec strict validation and ESLint for the changed files; both pass.
- [x] 3.2 Run TypeScript checking and document pre-existing failures unrelated to this change (stale `.next` validator references and `scripts/migrate-core.test.ts` mock types).
- [ ] 3.3 Visually inspect the dashboard at desktop and narrow viewport widths; verify cards, charts, tables, and filter controls stay within their parent box.
