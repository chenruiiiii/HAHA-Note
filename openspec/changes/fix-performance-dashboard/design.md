## Context

See `proposal.md` for the user-visible problem. The dashboard is a client component using Ant Design, an SCSS module, and the existing `echarts` dependency. The API already returns aggregated summary items containing `p75`, `p95`, `budget`, `rating`, and `confidence`, so the visual fix does not require a data-contract change.

## Goals / Non-Goals

**Goals:**

- Keep the dashboard within the width of `MainContent` at desktop and narrow viewport sizes.
- Remove rating and confidence from the rendered dashboard without deleting aggregation data used elsewhere.
- Add readable, unit-correct ECharts visualizations for the four requested core metrics.
- Keep table overflow local to each table section.

**Non-Goals:**

- Redesign the performance event ingestion pipeline or change percentile calculations.
- Add historical time-bucket aggregation to the API.
- Add a new charting library or Tailwind configuration.

## Decisions

### Use the existing SCSS module and CSS Grid

The project's page uses SCSS modules rather than Tailwind utility classes. The dashboard will use responsive CSS Grid and flex wrapping, with `min-width: 0` on grid/flex children, instead of introducing Tailwind classes for one page. This avoids mixing styling systems and directly addresses the overflow cause.

Alternative considered: add Tailwind utilities to the component. Rejected because the page is already styled with a module and Tailwind content scanning is not configured for the App Router page tree.

### Render four independent ECharts cards

Each core metric gets its own chart instance and unit scale. The chart compares P75, P95, and the metric budget when available. This avoids combining milliseconds and CLS values in one axis and remains useful even when only one metric has data.

Alternative considered: one shared bar/line chart for all metrics. Rejected because the units are not comparable and would require misleading normalization.

### Reuse the existing ECharts package

`echarts` is already a runtime dependency. A small client-only chart component will initialize ECharts, update it when data changes, and dispose it on unmount. Resize handling will use a `ResizeObserver` so charts respond when the sidebar or viewport changes.

Alternative considered: add `echarts-for-react`. Rejected because it adds a dependency for a small wrapper that can be implemented directly.

### Keep aggregation fields but remove their presentation

The API and summary type retain `rating` and `confidence` for diagnostics and future use, while the dashboard stops rendering both. This is the smallest compatible change and avoids breaking consumers or tests that depend on the aggregation contract.

### Localize horizontal overflow

Table sections will use `min-width: 0` and an overflow wrapper around the Ant Design table. The page itself will not gain a second horizontal scrollbar, and the summary table can be read on narrow screens.

## Risks / Trade-offs

- [ECharts adds client-side bundle weight] -> Keep imports limited to the ECharts modules needed for the chart and load the wrapper only on the dashboard page.
- [A chart may resize to zero width during layout changes] -> Guard initialization and call `resize()` from `ResizeObserver` after the container has dimensions.
- [Removing visible rating may reduce quick interpretation] -> Preserve P75/P95/budget values and use chart colors to distinguish current values from budget reference.
- [Summary rows can still be numerous] -> Keep the existing pagination and local table scroll.

## Migration Plan

No data migration or endpoint change is required. Deploy the component and style changes with the existing dashboard route; rollback is a normal code revert.
