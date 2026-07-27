import clientPromise from '@/lib/mongodb';
import { getBudget, rateMetric } from '@/lib/performance/budget';
import { normalizeRoute } from '@/lib/performance/route';
import type {
  PerformanceDashboardData,
  PerformanceMetricPayload,
  PerformanceSlowItem,
  PerformanceSummaryItem,
} from '@/lib/performance/types';
import { NextResponse } from 'next/server';

const DB_NAME = 'performance';
const COLLECTION_NAME = 'performance_events';
const MAX_QUERY_LIMIT = 1200;

const ALLOWED_EVENTS = new Set([
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

function toFiniteNumber(value: unknown) {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

function sanitizeEvent(body: Partial<PerformanceMetricPayload>): PerformanceMetricPayload | null {
  if (!body.event || !ALLOWED_EVENTS.has(body.event)) {
    return null;
  }

  const durationMs = toFiniteNumber(body.duration_ms);
  const value = toFiniteNumber(body.value);
  const firstTokenMs = toFiniteNumber(body.first_token_ms);
  const totalMs = toFiniteNumber(body.total_ms);
  const statusCode = toFiniteNumber(body.status_code);
  const retryCount = toFiniteNumber(body.retry_count);

  return {
    event: body.event,
    route: normalizeRoute(typeof body.route === 'string' ? body.route : 'unknown'),
    metric_name: typeof body.metric_name === 'string' ? body.metric_name.slice(0, 80) : undefined,
    value,
    duration_ms: durationMs,
    rating: typeof body.rating === 'string' ? body.rating.slice(0, 30) : undefined,
    success: typeof body.success === 'boolean' ? body.success : undefined,
    error_type: typeof body.error_type === 'string' ? body.error_type.slice(0, 80) : undefined,
    retry_count: retryCount,
    first_token_ms: firstTokenMs ?? null,
    total_ms: totalMs,
    status_code: statusCode,
    method: typeof body.method === 'string' ? body.method.slice(0, 12).toUpperCase() : undefined,
    release: typeof body.release === 'string' ? body.release.slice(0, 80) : 'local',
    device_type: body.device_type,
    network_type: typeof body.network_type === 'string' ? body.network_type.slice(0, 40) : undefined,
    timestamp: typeof body.timestamp === 'string' ? body.timestamp : new Date().toISOString(),
  };
}

function percentile(values: number[], percentileValue: number) {
  if (!values.length) {
    return 0;
  }

  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.ceil((percentileValue / 100) * sorted.length) - 1;
  return sorted[Math.max(0, Math.min(index, sorted.length - 1))];
}

function getMetricValue(event: PerformanceMetricPayload) {
  if (event.event === 'ai_first_token') {
    return event.first_token_ms ?? event.duration_ms ?? event.value;
  }

  if (event.event === 'ai_generation_completed') {
    return event.total_ms ?? event.duration_ms ?? event.value;
  }

  return event.duration_ms ?? event.value;
}

function getSummaryKey(event: PerformanceMetricPayload) {
  return [event.event, event.metric_name ?? '', event.route ?? 'unknown'].join('|');
}

function buildDashboardData(events: PerformanceMetricPayload[]): PerformanceDashboardData {
  const grouped = new Map<string, PerformanceMetricPayload[]>();

  events.forEach((event) => {
    const value = getMetricValue(event);

    if (typeof value !== 'number') {
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
    const p75 = percentile(values, 75);
    const budget = getBudget(first.metric_name, first.event);

    return {
      event: first.event,
      metric_name: first.metric_name,
      route: first.route ?? 'unknown',
      count: items.length,
      avg: Math.round(avg),
      p75: Number(p75.toFixed(2)),
      budget,
      rating: rateMetric(p75, budget),
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

  const aiCompleted = events.filter((event) => event.event === 'ai_generation_completed');
  const apiCompleted = events.filter((event) => event.event === 'api_request_completed');

  const getSuccessRate = (items: PerformanceMetricPayload[]) => {
    if (!items.length) {
      return null;
    }

    const successCount = items.filter((item) => item.success !== false).length;
    return Number(((successCount / items.length) * 100).toFixed(1));
  };

  return {
    summary: summary.sort((a, b) => b.p75 - a.p75).slice(0, 30),
    slow,
    totals: {
      count: events.length,
      ai_success_rate: getSuccessRate(aiCompleted),
      api_success_rate: getSuccessRate(apiCompleted),
    },
  };
}

export async function POST(request: Request): Promise<Response> {
  try {
    const body = (await request.json()) as Partial<PerformanceMetricPayload>;
    const event = sanitizeEvent(body);

    if (!event) {
      return NextResponse.json(
        {
          code: 400,
          message: 'Invalid performance event',
        },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const collection = client.db(DB_NAME).collection(COLLECTION_NAME);

    await collection.insertOne({
      ...event,
      received_at: new Date(),
    });

    return NextResponse.json({
      code: 200,
      message: 'ok',
    });
  } catch {
    return NextResponse.json(
      {
        code: 500,
        message: 'Failed to save performance event',
      },
      { status: 500 }
    );
  }
}

export async function GET(request: Request): Promise<Response> {
  try {
    const { searchParams } = new URL(request.url);
    const hours = Number(searchParams.get('hours') ?? 24);
    const since = new Date(Date.now() - Math.max(1, Math.min(hours, 168)) * 60 * 60 * 1000);
    const route = searchParams.get('route');
    const event = searchParams.get('event');

    const client = await clientPromise;
    const collection = client.db(DB_NAME).collection<PerformanceMetricPayload & { received_at: Date }>(
      COLLECTION_NAME
    );
    const query: Record<string, unknown> = {
      received_at: {
        $gte: since,
      },
    };

    if (route) {
      query.route = normalizeRoute(route);
    }

    if (event && ALLOWED_EVENTS.has(event)) {
      query.event = event;
    }

    const events = (await collection
      .find(query)
      .sort({ received_at: -1 })
      .limit(MAX_QUERY_LIMIT)
      .project({ _id: 0, received_at: 0 })
      .toArray()) as PerformanceMetricPayload[];

    return NextResponse.json({
      code: 200,
      data: buildDashboardData(events),
      message: 'ok',
    });
  } catch {
    return NextResponse.json(
      {
        code: 500,
        data: null,
        message: 'Failed to load performance events',
      },
      { status: 500 }
    );
  }
}
