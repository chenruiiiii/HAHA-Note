import { rateMetric } from './budget';
import { trackPerformance } from './track';
import type { PerformanceEventName, PerformanceMetricPayload } from './types';

export function startPerformanceTimer(metricName: string) {
  const startedAt =
    typeof performance !== 'undefined' && performance.now ? performance.now() : Date.now();

  return {
    end(
      event: PerformanceEventName,
      payload: Omit<PerformanceMetricPayload, 'event' | 'duration_ms' | 'metric_name'> & {
        budget?: number;
      } = {}
    ) {
      const endedAt =
        typeof performance !== 'undefined' && performance.now ? performance.now() : Date.now();
      const duration = Math.round(endedAt - startedAt);
      const { budget, ...restPayload } = payload;

      trackPerformance(event, {
        ...restPayload,
        metric_name: metricName,
        duration_ms: duration,
        value: duration,
        rating: payload.rating ?? rateMetric(duration, budget),
      });

      return duration;
    },
  };
}
