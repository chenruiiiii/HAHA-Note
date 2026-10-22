## Purpose

Provide a responsive performance monitoring dashboard that presents core web and AI latency metrics clearly at desktop and narrow viewport widths.

## ADDED Requirements

### Requirement: Responsive dashboard layout

The performance dashboard SHALL keep its title, filter controls, metric cards, charts, and table sections within the available parent width at viewport widths down to 360px.

#### Scenario: Narrow viewport

- **WHEN** the dashboard is rendered in a viewport narrower than 768px
- **THEN** the header and filter controls wrap into multiple rows and no dashboard section extends beyond the parent container

#### Scenario: Very narrow viewport

- **WHEN** the dashboard is rendered at 360px width
- **THEN** metric cards and chart cards stack without clipping their labels or values

### Requirement: Rating and confidence visibility

The dashboard SHALL NOT display performance rating or sample confidence values in featured metric cards or the summary metrics table.

#### Scenario: Featured cards rendered

- **WHEN** performance summary data includes rating and confidence values
- **THEN** the featured metric cards display only metric labels and values

#### Scenario: Summary table rendered

- **WHEN** the summary metrics table is displayed
- **THEN** it contains no rating or confidence columns

### Requirement: Core metric charts

The dashboard SHALL render ECharts visualizations for LCP, INP, CLS, and AI first-token latency, using an independent scale for each metric.

#### Scenario: Core metrics available

- **WHEN** summary data contains LCP, INP, CLS, or AI first-token values
- **THEN** the corresponding chart shows P75, P95, and the configured budget when a budget exists

#### Scenario: Core metric unavailable

- **WHEN** a core metric has no summary data
- **THEN** its chart remains present and communicates that no data is available without breaking the layout

### Requirement: Contained table overflow

Wide performance tables SHALL scroll horizontally inside their own section rather than expanding the dashboard or parent container.

#### Scenario: Table wider than viewport

- **WHEN** the summary table columns exceed the available section width
- **THEN** the table provides horizontal scrolling within the section while the dashboard remains within the viewport
