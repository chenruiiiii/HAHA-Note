import { getBudget, rateMetric } from './budget';
import type {
  DeviceType,
  NetworkType,
  PerformanceDashboardData,
  PerformanceEventName,
  PerformanceMetricPayload,
  PerformanceSlowItem,
  PerformanceSummaryItem,
} from './types';

export const MIN_RELIABLE_SAMPLES = 10;

export function percentile(values: number[], percentileValue: number) {
  if (!values.length) {
    return 0;
  }

  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.ceil((percentileValue / 100) * sorted.length) - 1;
  return sorted[Math.max(0, Math.min(index, sorted.length - 1))];
}

export function getMetricValue(event: PerformanceMetricPayload) {
  if (event.event === 'ai_first_token') {
    return event.first_token_ms ?? event.duration_ms ?? event.value;
  }

  if (
    event.event === 'ai_generation_completed' ||
    event.event === 'ai_generation_failed' ||
    event.event === 'ai_generation_cancelled'
  ) {
    return event.total_ms ?? event.duration_ms ?? event.value;
  }

  return event.duration_ms ?? event.value;
}

export function dedupePerformanceEvents(events: PerformanceMetricPayload[]) {
  const seenMetricIds = new Set<string>();

  return events.filter((event) => {
    if (event.event !== 'web_vital' || !event.metric_id) {
      return true;
    }

    if (seenMetricIds.has(event.metric_id)) {
      return false;
    }

    seenMetricIds.add(event.metric_id);
    return true;
  });
}

function getSummaryKey(event: PerformanceMetricPayload) {
  return [
    event.event,
    event.metric_name ?? '',
    event.route ?? 'unknown',
    event.device_type ?? 'unknown',
    event.network_type ?? 'unknown',
    event.release ?? 'local',
  ].join('|');
}

function getSuccessRate(items: PerformanceMetricPayload[]) {
  if (!items.length) {
    return null;
  }

  const successful = items.filter((item) => item.success === true).length;
  return Number(((successful / items.length) * 100).toFixed(1));
}

function getFacets(events: PerformanceMetricPayload[]) {
  return {
    routes: Array.from(new Set(events.map((event) => event.route ?? 'unknown'))).sort(),
    devices: Array.from(new Set(events.map((event) => event.device_type ?? 'unknown'))).sort() as DeviceType[],
    networks: Array.from(new Set(events.map((event) => event.network_type ?? 'unknown'))).sort() as NetworkType[],
    releases: Array.from(new Set(events.map((event) => event.release ?? 'local'))).sort(),
    events: Array.from(new Set(events.map((event) => event.event))).sort() as PerformanceEventName[],
  };
}

export function buildDashboardData(inputEvents: PerformanceMetricPayload[]): PerformanceDashboardData {
  const events = dedupePerformanceEvents(inputEvents);
  const grouped = new Map<string, PerformanceMetricPayload[]>();

  events.forEach((event) => {
    if (typeof getMetricValue(event) !== 'number') {
      return;
    }

    const key = getSummaryKey(event);
    grouped.set(key, [...(grouped.get(key) ?? []), event]);
  });

  const summary: PerformanceSummaryItem[] = Array.from(grouped.values()).map((items) => {
    const first = items[0];
    const values = items
      .map((item) => getMetricValue(item))
      .filter((value): value is number => typeof value === 'number');
    const avg = values.reduce((sum, value) => sum + value, 0) / values.length;
    const p50 = percentile(values, 50);
    const p75 = percentile(values, 75);
    const p95 = percentile(values, 95);
    const budget = getBudget(first.metric_name, first.event);
    const confidence = values.length >= MIN_RELIABLE_SAMPLES ? 'reliable' : 'insufficient';

    return {
      event: first.event,
      metric_name: first.metric_name,
      route: first.route ?? 'unknown',
      count: values.length,
      samples: values.length,
      avg: Math.round(avg),
      p50: Number(p50.toFixed(2)),
      p75: Number(p75.toFixed(2)),
      p95: Number(p95.toFixed(2)),
      budget,
      rating: confidence === 'reliable' ? rateMetric(p75, budget) : 'unknown',
      confidence,
      device_type: first.device_type ?? 'unknown',
      network_type: first.network_type ?? 'unknown',
      release: first.release ?? 'local',
    };
  });

  const slow: PerformanceSlowItem[] = events
    .map((event) => ({
      event: event.event,
      route: event.route ?? 'unknown',
      metric_name: event.metric_name,
      duration_ms: getMetricValue(event) ?? 0,
      timestamp: event.timestamp ?? '',
      success: event.success,
    }))
    .filter((item) => item.duration_ms > 0)
    .sort((a, b) => b.duration_ms - a.duration_ms)
    .slice(0, 10);

  const aiTerminal = events.filter((event) =>
    ['ai_generation_completed', 'ai_generation_failed', 'ai_generation_cancelled'].includes(event.event)
  );
  const apiCompleted = events.filter((event) => event.event === 'api_request_completed');
  const confidence = summary.some((item) => item.confidence === 'reliable') ? 'reliable' : 'insufficient';

  return {
    summary: summary.sort((a, b) => b.p75 - a.p75).slice(0, 100),
    slow,
    totals: {
      count: events.length,
      ai_success_rate: getSuccessRate(aiTerminal),
      api_success_rate: getSuccessRate(apiCompleted),
      confidence,
    },
    facets: getFacets(events),
  };
}
