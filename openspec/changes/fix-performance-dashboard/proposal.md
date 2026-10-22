## Why

The performance dashboard currently breaks at narrow viewport widths: its header filters do not wrap, and the metrics table can overflow its parent container. The dashboard also exposes rating and confidence values that the product no longer wants to surface, and it lacks a visual comparison of the core metrics.

## What Changes

- Make the dashboard layout responsive so the title, filters, metric cards, charts, and tables remain inside their parent container at narrow widths.
- Remove visible rating and confidence values from the featured metric cards and the summary table. The underlying performance data contract remains available for aggregation and diagnostics.
- Add ECharts visualizations for LCP, INP, CLS, and AI first-token latency. Each chart uses its own scale and shows P75, P95, and the configured budget where available.
- Make wide tables horizontally scrollable within their section instead of forcing the page or parent box to overflow.
- Preserve the existing filters, loading state, refresh behavior, and data-fetching contract.

## Capabilities

### New Capabilities

- `performance-dashboard`: Responsive presentation and charting of the performance monitoring dashboard.

### Modified Capabilities

- None.

## Impact

- Affected UI: `src/components/layout/PerformanceDashboard/index.tsx` and its SCSS module.
- Dependencies: reuse the existing `echarts` dependency; no new package is required.
- API/data contract: unchanged. No database or endpoint migration is required.
