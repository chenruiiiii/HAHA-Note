import 'server-only';
import type { Prisma } from '@/generated/prisma/client';
import { getPrisma } from '@/lib/prisma';
import type {
  DeviceType,
  NetworkType,
  PerformanceMetricPayload,
} from '@/lib/performance/types';

export interface PerformanceEventFilters {
  since: Date;
  route?: string;
  event?: string;
  deviceType?: string;
  networkType?: string;
  release?: string;
  take: number;
}

export async function savePerformanceEvent(
  event: PerformanceMetricPayload
): Promise<void> {
  const prisma = getPrisma();
  const data = {
    event: event.event,
    route: event.route ?? 'unknown',
    metricName: event.metric_name ?? null,
    metricId: event.metric_id ?? null,
    value: event.value ?? null,
    durationMs: event.duration_ms ?? null,
    rating: event.rating ?? null,
    success: event.success ?? null,
    errorType: event.error_type ?? null,
    retryCount: event.retry_count ?? null,
    firstTokenMs: event.first_token_ms ?? null,
    totalMs: event.total_ms ?? null,
    statusCode: event.status_code ?? null,
    method: event.method ?? null,
    release: event.release ?? 'local',
    deviceType: event.device_type ?? 'unknown',
    networkType: event.network_type ?? 'unknown',
    timestamp: event.timestamp ? new Date(event.timestamp) : new Date(),
  };

  if (event.event === 'web_vital' && event.metric_id) {
    await prisma.performanceEvent.upsert({
      where: { metricId: event.metric_id },
      update: {},
      create: data,
    });
    return;
  }

  await prisma.performanceEvent.create({ data });
}

export async function listPerformanceEvents(
  filters: PerformanceEventFilters
): Promise<PerformanceMetricPayload[]> {
  const prisma = getPrisma();
  const where: Prisma.PerformanceEventWhereInput = {
    receivedAt: { gte: filters.since },
  };

  if (filters.route) {
    where.route = filters.route;
  }
  if (filters.event) {
    where.event = filters.event;
  }
  if (filters.deviceType) {
    where.deviceType = filters.deviceType;
  }
  if (filters.networkType) {
    where.networkType = filters.networkType;
  }
  if (filters.release) {
    where.release = filters.release;
  }

  const rows = await prisma.performanceEvent.findMany({
    where,
    orderBy: { receivedAt: 'desc' },
    take: filters.take,
  });

  return rows.map((row) => ({
    event: row.event as PerformanceMetricPayload['event'],
    route: row.route,
    metric_name: row.metricName ?? undefined,
    metric_id: row.metricId ?? undefined,
    value: row.value ?? undefined,
    duration_ms: row.durationMs ?? undefined,
    rating: row.rating ?? undefined,
    success: row.success ?? undefined,
    error_type: row.errorType ?? undefined,
    retry_count: row.retryCount ?? undefined,
    first_token_ms: row.firstTokenMs,
    total_ms: row.totalMs ?? undefined,
    status_code: row.statusCode ?? undefined,
    method: row.method ?? undefined,
    release: row.release,
    device_type: row.deviceType as DeviceType,
    network_type: row.networkType as NetworkType,
    timestamp: row.timestamp.toISOString(),
  }));
}
