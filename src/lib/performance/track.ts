import { getDeviceType, getNetworkType } from './device';
import { getCurrentRoute, normalizeRoute } from './route';
import type { PerformanceEventName, PerformanceMetricPayload } from './types';

const PERFORMANCE_ENDPOINT = '/api/performance';

function getRelease() {
  return process.env.NEXT_PUBLIC_APP_VERSION || process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA || 'local';
}

function getSampleRate() {
  const configuredRate = Number(process.env.NEXT_PUBLIC_RUM_SAMPLE_RATE);
  if (Number.isFinite(configuredRate) && configuredRate >= 0 && configuredRate <= 1) {
    return configuredRate;
  }

  return process.env.NODE_ENV === 'production' ? 0.1 : 1;
}

let sampleDecision: boolean | undefined;

function shouldSample() {
  if (sampleDecision === undefined) {
    sampleDecision = Math.random() < getSampleRate();
  }

  return sampleDecision;
}

function sanitizePayload(payload: PerformanceMetricPayload): PerformanceMetricPayload {
  return {
    event: payload.event,
    route: normalizeRoute(payload.route ?? getCurrentRoute()),
    metric_name: payload.metric_name,
    metric_id: payload.metric_id,
    value: payload.value,
    duration_ms: payload.duration_ms,
    rating: payload.rating,
    success: payload.success,
    error_type: payload.error_type,
    retry_count: payload.retry_count,
    first_token_ms: payload.first_token_ms,
    total_ms: payload.total_ms,
    status_code: payload.status_code,
    method: payload.method,
    release: payload.release ?? getRelease(),
    device_type: payload.device_type ?? getDeviceType(),
    network_type: payload.network_type ?? getNetworkType(),
    timestamp: payload.timestamp ?? new Date().toISOString(),
  };
}

export function trackPerformance(
  event: PerformanceEventName,
  payload: Omit<PerformanceMetricPayload, 'event'> = {}
) {
  if (typeof window === 'undefined') {
    return;
  }

  if (!shouldSample()) {
    return;
  }

  const body = JSON.stringify(sanitizePayload({ ...payload, event }));

  if (navigator.sendBeacon) {
    const sent = navigator.sendBeacon(PERFORMANCE_ENDPOINT, body);

    if (sent) {
      return;
    }
  }

  void fetch(PERFORMANCE_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body,
    keepalive: true,
  }).catch(() => null);
}
