import { normalizeRoute } from './route';
import type {
  DeviceType,
  NetworkType,
  PerformanceEventName,
  PerformanceMetricPayload,
  PerformanceRating,
} from './types';

export const MAX_PERFORMANCE_PAYLOAD_BYTES = 8 * 1024;
export const PERFORMANCE_RETENTION_SECONDS = 30 * 24 * 60 * 60;

export const ALLOWED_EVENTS = new Set<PerformanceEventName>([
  'web_vital',
  'api_request_completed',
  'note_open_completed',
  'note_save_completed',
  'search_completed',
  'editor_ready',
  'ai_generation_started',
  'ai_first_token',
  'ai_generation_completed',
  'ai_generation_cancelled',
  'ai_generation_failed',
]);

const ALLOWED_FIELDS = new Set([
  'event',
  'route',
  'metric_name',
  'metric_id',
  'value',
  'duration_ms',
  'rating',
  'success',
  'error_type',
  'retry_count',
  'first_token_ms',
  'total_ms',
  'status_code',
  'method',
  'release',
  'device_type',
  'network_type',
  'timestamp',
]);

const DEVICE_TYPES = new Set<DeviceType>(['mobile', 'tablet', 'desktop', 'unknown']);
const NETWORK_TYPES = new Set<NetworkType>([
  'slow-2g',
  '2g',
  '3g',
  '4g',
  '5g',
  'wifi',
  'unknown',
]);
const RATINGS = new Set<PerformanceRating>(['good', 'needs-improvement', 'poor']);
const WEB_VITALS = new Set(['CLS', 'FCP', 'INP', 'LCP', 'TTFB']);
const SAFE_TEXT_RE = /^[A-Za-z0-9._:/-]+$/;
const MAX_METRIC_VALUE = 24 * 60 * 60 * 1000;

type UnknownRecord = Record<string, unknown>;

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function readOptionalNumber(value: unknown, max = MAX_METRIC_VALUE) {
  if (value === undefined) {
    return undefined;
  }

  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0 || value > max) {
    return null;
  }

  return value;
}

function readOptionalInteger(value: unknown, min: number, max: number) {
  if (value === undefined) {
    return undefined;
  }

  if (typeof value !== 'number' || !Number.isInteger(value) || value < min || value > max) {
    return null;
  }

  return value;
}

function readOptionalText(value: unknown, maxLength: number) {
  if (value === undefined) {
    return undefined;
  }

  if (typeof value !== 'string' || value.length === 0 || value.length > maxLength) {
    return null;
  }

  return value;
}

function readRequiredText(value: unknown, maxLength: number) {
  if (typeof value !== 'string' || value.length === 0 || value.length > maxLength) {
    return null;
  }

  return value;
}

export function normalizePerformanceEvent(body: unknown): PerformanceMetricPayload | null {
  if (!isRecord(body)) {
    return null;
  }

  if (Object.keys(body).some((key) => !ALLOWED_FIELDS.has(key))) {
    return null;
  }

  const event = readRequiredText(body.event, 64);
  if (!event || !ALLOWED_EVENTS.has(event as PerformanceEventName)) {
    return null;
  }

  const routeInput = body.route;
  if (routeInput !== undefined && (typeof routeInput !== 'string' || routeInput.length > 512)) {
    return null;
  }

  const route = normalizeRoute(typeof routeInput === 'string' ? routeInput : 'unknown');
  if (route.length > 160 || route.includes('://')) {
    return null;
  }

  const metricName = readOptionalText(body.metric_name, 80);
  const metricId = readOptionalText(body.metric_id, 120);
  const errorType = readOptionalText(body.error_type, 80);
  const releaseText = readOptionalText(body.release, 80);
  const method = readOptionalText(body.method, 12);
  const timestamp = readOptionalText(body.timestamp, 40);
  const deviceType = body.device_type === undefined ? 'unknown' : body.device_type;
  const networkType = body.network_type === undefined ? 'unknown' : body.network_type;
  const rating = body.rating;
  const success = body.success;
  const value = readOptionalNumber(body.value);
  const durationMs = readOptionalNumber(body.duration_ms);
  const firstTokenMs = readOptionalNumber(body.first_token_ms);
  const totalMs = readOptionalNumber(body.total_ms);
  const retryCount = readOptionalInteger(body.retry_count, 0, 20);
  const statusCode = readOptionalInteger(body.status_code, 100, 599);

  if (
    metricName === null ||
    metricId === null ||
    errorType === null ||
    releaseText === null ||
    method === null ||
    timestamp === null ||
    value === null ||
    durationMs === null ||
    firstTokenMs === null ||
    totalMs === null ||
    retryCount === null ||
    statusCode === null ||
    !DEVICE_TYPES.has(deviceType as DeviceType) ||
    !NETWORK_TYPES.has(networkType as NetworkType) ||
    (rating !== undefined && (typeof rating !== 'string' || !RATINGS.has(rating as PerformanceRating))) ||
    (success !== undefined && typeof success !== 'boolean') ||
    (method !== undefined && !SAFE_TEXT_RE.test(method)) ||
    (releaseText !== undefined && !SAFE_TEXT_RE.test(releaseText)) ||
    (metricName !== undefined && !SAFE_TEXT_RE.test(metricName)) ||
    (metricId !== undefined && !SAFE_TEXT_RE.test(metricId)) ||
    (errorType !== undefined && !SAFE_TEXT_RE.test(errorType))
  ) {
    return null;
  }

  if (event === 'web_vital' && (!metricName || !WEB_VITALS.has(metricName) || !metricId || value === undefined)) {
    return null;
  }

  const hasMeasurement =
    value !== undefined ||
    durationMs !== undefined ||
    firstTokenMs !== undefined ||
    totalMs !== undefined;
  if (event !== 'ai_generation_started' && !hasMeasurement) {
    return null;
  }

  const parsedTimestamp = timestamp ? new Date(timestamp) : new Date();
  if (Number.isNaN(parsedTimestamp.getTime())) {
    return null;
  }

  return {
    event: event as PerformanceEventName,
    route,
    metric_name: metricName ?? undefined,
    metric_id: metricId ?? undefined,
    value,
    duration_ms: durationMs,
    rating: rating as PerformanceRating | undefined,
    success: success as boolean | undefined,
    error_type: errorType ?? undefined,
    retry_count: retryCount,
    first_token_ms: firstTokenMs,
    total_ms: totalMs,
    status_code: statusCode,
    method: method ?? undefined,
    release: releaseText ?? 'local',
    device_type: deviceType as DeviceType,
    network_type: networkType as NetworkType,
    timestamp: parsedTimestamp.toISOString(),
  };
}
