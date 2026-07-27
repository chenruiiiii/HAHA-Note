import type { PerformanceEventName, PerformanceRating } from './types';

export const PERFORMANCE_BUDGET = {
  LCP: 2500,
  INP: 200,
  CLS: 0.1,
  FCP: 1800,
  TTFB: 800,
  api_request_ms: 1000,
  open_note_ms: 800,
  save_note_ms: 500,
  search_ms: 500,
  editor_ready_ms: 1200,
  ai_first_token_ms: 1500,
  ai_total_ms: 10000,
} as const;

export function getBudget(metricName?: string, event?: PerformanceEventName | string) {
  if (metricName && metricName in PERFORMANCE_BUDGET) {
    return PERFORMANCE_BUDGET[metricName as keyof typeof PERFORMANCE_BUDGET];
  }

  if (event === 'api_request_completed') {
    return PERFORMANCE_BUDGET.api_request_ms;
  }

  if (event === 'editor_ready') {
    return PERFORMANCE_BUDGET.editor_ready_ms;
  }

  return undefined;
}

export function rateMetric(value: number, budget?: number): PerformanceRating {
  if (!budget) {
    return 'good';
  }

  if (value <= budget) {
    return 'good';
  }

  if (value <= budget * 1.5) {
    return 'needs-improvement';
  }

  return 'poor';
}
