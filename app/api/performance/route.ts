import clientPromise from '@/lib/mongodb';
import {
  ALLOWED_EVENTS,
  MAX_PERFORMANCE_PAYLOAD_BYTES,
  buildDashboardData,
  normalizePerformanceEvent,
} from '@/lib/performance';
import { normalizeRoute } from '@/lib/performance/route';
import type { PerformanceMetricPayload } from '@/lib/performance/types';
import { NextResponse } from 'next/server';

const DB_NAME = 'performance';
const COLLECTION_NAME = 'performance_events';
const MAX_QUERY_LIMIT = 1200;
const ALLOWED_DEVICES = new Set(['mobile', 'tablet', 'desktop', 'unknown']);
const ALLOWED_NETWORKS = new Set(['slow-2g', '2g', '3g', '4g', '5g', 'wifi', 'unknown']);

function toLimitedText(value: string | null, maxLength: number) {
  if (!value) {
    return undefined;
  }

  const trimmed = value.trim();
  if (!trimmed || trimmed.length > maxLength) {
    return undefined;
  }

  return trimmed;
}

function getHours(searchParams: URLSearchParams) {
  const raw = Number(searchParams.get('hours') ?? 24);
  if (!Number.isFinite(raw)) {
    return 24;
  }

  return Math.max(1, Math.min(Math.floor(raw), 168));
}

async function readRequestBody(request: Request) {
  const body = await request.arrayBuffer();
  if (body.byteLength > MAX_PERFORMANCE_PAYLOAD_BYTES) {
    return { oversized: true } as const;
  }

  const text = new TextDecoder().decode(body);
  try {
    return { parsed: JSON.parse(text) as unknown } as const;
  } catch {
    return { parsed: null } as const;
  }
}

function buildQuery(searchParams: URLSearchParams, since: Date) {
  const query: Record<string, unknown> = {
    received_at: {
      $gte: since,
    },
  };

  const route = toLimitedText(searchParams.get('route'), 512);
  if (route) {
    query.route = normalizeRoute(route);
  }

  const event = toLimitedText(searchParams.get('event'), 64);
  if (event && ALLOWED_EVENTS.has(event as PerformanceMetricPayload['event'])) {
    query.event = event;
  }

  const device = toLimitedText(searchParams.get('device'), 16);
  if (device && ALLOWED_DEVICES.has(device)) {
    query.device_type = device;
  }

  const network = toLimitedText(searchParams.get('network'), 16);
  if (network && ALLOWED_NETWORKS.has(network)) {
    query.network_type = network;
  }

  const release = toLimitedText(searchParams.get('release'), 80);
  if (release) {
    query.release = release;
  }

  return query;
}

export async function POST(request: Request): Promise<Response> {
  try {
    const bodyResult = await readRequestBody(request);

    if ('oversized' in bodyResult) {
      return NextResponse.json(
        {
          code: 413,
          message: 'Performance payload too large',
        },
        { status: 413 }
      );
    }

    const event = normalizePerformanceEvent(bodyResult.parsed);

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
    const document = {
      ...event,
      received_at: new Date(),
    };

    if (event.event === 'web_vital' && event.metric_id) {
      await collection.updateOne(
        { event: 'web_vital', metric_id: event.metric_id },
        { $setOnInsert: document },
        { upsert: true }
      );
    } else {
      await collection.insertOne(document);
    }

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
    const hours = getHours(searchParams);
    const since = new Date(Date.now() - hours * 60 * 60 * 1000);
    const client = await clientPromise;
    const collection = client.db(DB_NAME).collection<PerformanceMetricPayload & { received_at: Date }>(
      COLLECTION_NAME
    );
    const events = (await collection
      .find(buildQuery(searchParams, since))
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
