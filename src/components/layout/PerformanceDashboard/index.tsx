'use client';

import MainContent from '@/components/layout/MainContent';
import type {
  PerformanceDashboardData,
  PerformanceSlowItem,
  PerformanceSummaryItem,
} from '@/lib/performance';
import { Alert, Button, Select, Space, Table, Tag } from 'antd';
import { ReloadOutlined } from '@ant-design/icons';
import { useCallback, useEffect, useMemo, useState } from 'react';
import styles from './style.module.scss';

interface ResponseData<T> {
  code: number;
  data: T;
  message: string;
}

const EMPTY_DATA: PerformanceDashboardData = {
  summary: [],
  slow: [],
  totals: {
    count: 0,
    ai_success_rate: null,
    api_success_rate: null,
    confidence: 'insufficient',
  },
  facets: {
    routes: [],
    devices: [],
    networks: [],
    releases: [],
    events: [],
  },
};

const RATING_COLOR = {
  good: 'green',
  'needs-improvement': 'gold',
  poor: 'red',
  unknown: 'default',
} as const;

const CONFIDENCE_COLOR = {
  reliable: 'blue',
  insufficient: 'default',
} as const;

function formatMs(value?: number) {
  if (typeof value !== 'number') {
    return '-';
  }

  if (value >= 1000) {
    return `${(value / 1000).toFixed(2)}s`;
  }

  return `${value}ms`;
}

function formatRate(value: number | null) {
  return typeof value === 'number' ? `${value}%` : '-';
}

export default function PerformanceDashboard() {
  const [hours, setHours] = useState(24);
  const [route, setRoute] = useState<string | undefined>();
  const [device, setDevice] = useState<string | undefined>();
  const [network, setNetwork] = useState<string | undefined>();
  const [release, setRelease] = useState<string | undefined>();
  const [event, setEvent] = useState<string | undefined>();
  const [data, setData] = useState<PerformanceDashboardData>(EMPTY_DATA);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError('');

    try {
      const params = new URLSearchParams({
        hours: String(hours),
      });

      if (route) {
        params.set('route', route);
      }

      if (device) {
        params.set('device', device);
      }

      if (network) {
        params.set('network', network);
      }

      if (release) {
        params.set('release', release);
      }

      if (event) {
        params.set('event', event);
      }

      const response = await fetch(`/api/performance?${params.toString()}`, {
        cache: 'no-store',
      });
      const json = (await response.json()) as ResponseData<PerformanceDashboardData>;

      if (!response.ok || json.code !== 200) {
        throw new Error(json.message || '性能数据加载失败');
      }

      setData(json.data ?? EMPTY_DATA);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : '性能数据加载失败');
      setData(EMPTY_DATA);
    } finally {
      setIsLoading(false);
    }
  }, [device, event, hours, release, route, network]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadData();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [loadData]);

  const featuredMetrics = useMemo(() => {
    const findMetric = (event: string, metricName?: string) =>
      data.summary.find(
        (item) => item.event === event && (!metricName || item.metric_name === metricName)
      );

    return [
      {
        label: 'LCP P75',
        value: formatMs(findMetric('web_vital', 'LCP')?.p75),
        rating: findMetric('web_vital', 'LCP')?.rating,
      },
      {
        label: 'INP P75',
        value: formatMs(findMetric('web_vital', 'INP')?.p75),
        rating: findMetric('web_vital', 'INP')?.rating,
      },
      {
        label: 'CLS P75',
        value: findMetric('web_vital', 'CLS')?.p75?.toFixed(3) ?? '-',
        rating: findMetric('web_vital', 'CLS')?.rating,
      },
      {
        label: 'AI 首 token P75',
        value: formatMs(findMetric('ai_first_token', 'ai_first_token_ms')?.p75),
        rating: findMetric('ai_first_token', 'ai_first_token_ms')?.rating,
      },
      {
        label: 'AI 总耗时 P75',
        value: formatMs(findMetric('ai_generation_completed', 'ai_total_ms')?.p75),
        rating: findMetric('ai_generation_completed', 'ai_total_ms')?.rating,
      },
      {
        label: 'API 成功率',
        value: formatRate(data.totals.api_success_rate),
        rating: undefined,
      },
      {
        label: 'AI 成功率',
        value: formatRate(data.totals.ai_success_rate),
        rating: undefined,
      },
      {
        label: '事件数',
        value: String(data.totals.count),
        rating: undefined,
      },
    ];
  }, [data]);

  const summaryColumns = [
    {
      title: '事件',
      dataIndex: 'event',
      key: 'event',
    },
    {
      title: '指标',
      dataIndex: 'metric_name',
      key: 'metric_name',
      render: (value?: string) => value || '-',
    },
    {
      title: '路由',
      dataIndex: 'route',
      key: 'route',
    },
    {
      title: 'P75',
      dataIndex: 'p75',
      key: 'p75',
      render: (value: number, record: PerformanceSummaryItem) =>
        record.metric_name === 'CLS' ? value.toFixed(3) : formatMs(value),
    },
    {
      title: 'P50',
      dataIndex: 'p50',
      key: 'p50',
      render: (value: number, record: PerformanceSummaryItem) =>
        record.metric_name === 'CLS' ? value.toFixed(3) : formatMs(value),
    },
    {
      title: 'P95',
      dataIndex: 'p95',
      key: 'p95',
      render: (value: number, record: PerformanceSummaryItem) =>
        record.metric_name === 'CLS' ? value.toFixed(3) : formatMs(value),
    },
    {
      title: '平均',
      dataIndex: 'avg',
      key: 'avg',
      render: (value: number, record: PerformanceSummaryItem) =>
        record.metric_name === 'CLS' ? value.toFixed(3) : formatMs(value),
    },
    {
      title: '样本',
      dataIndex: 'samples',
      key: 'samples',
    },
    {
      title: '预算',
      dataIndex: 'budget',
      key: 'budget',
      render: (value?: number, record?: PerformanceSummaryItem) =>
        record?.metric_name === 'CLS' ? value?.toFixed(3) : formatMs(value),
    },
    {
      title: '评级',
      dataIndex: 'rating',
      key: 'rating',
      render: (value: keyof typeof RATING_COLOR) => (
        <Tag color={RATING_COLOR[value] ?? 'default'}>{value}</Tag>
      ),
    },
    {
      title: '置信度',
      dataIndex: 'confidence',
      key: 'confidence',
      render: (value: keyof typeof CONFIDENCE_COLOR) => (
        <Tag color={CONFIDENCE_COLOR[value] ?? 'default'}>{value}</Tag>
      ),
    },
    {
      title: '设备',
      dataIndex: 'device_type',
      key: 'device_type',
    },
    {
      title: '网络',
      dataIndex: 'network_type',
      key: 'network_type',
    },
    {
      title: '版本',
      dataIndex: 'release',
      key: 'release',
    },
    {
      title: '次数',
      dataIndex: 'count',
      key: 'count',
    },
  ];

  const slowColumns = [
    {
      title: '事件',
      dataIndex: 'event',
      key: 'event',
    },
    {
      title: '指标',
      dataIndex: 'metric_name',
      key: 'metric_name',
      render: (value?: string) => value || '-',
    },
    {
      title: '路由',
      dataIndex: 'route',
      key: 'route',
    },
    {
      title: '耗时',
      dataIndex: 'duration_ms',
      key: 'duration_ms',
      render: (value: number, record: PerformanceSlowItem) =>
        record.metric_name === 'CLS' ? value.toFixed(3) : formatMs(value),
    },
    {
      title: '结果',
      dataIndex: 'success',
      key: 'success',
      render: (value?: boolean) =>
        typeof value === 'boolean' ? (
          <Tag color={value ? 'green' : 'red'}>{value ? 'success' : 'failed'}</Tag>
        ) : (
          '-'
        ),
    },
    {
      title: '时间',
      dataIndex: 'timestamp',
      key: 'timestamp',
      render: (value: string) => (value ? new Date(value).toLocaleString() : '-'),
    },
  ];

  const selectStyle = { width: 160 };

  return (
    <MainContent isLoading={isLoading}>
      <div className={styles.dashboard}>
        <div className={styles.header}>
          <div>
            <h1>性能检测</h1>
            <p>按 P75 查看页面、接口、编辑器和 AI 流式生成体验。</p>
          </div>
          <Space>
            <Select
              value={hours}
              onChange={setHours}
              options={[
                { value: 1, label: '最近 1 小时' },
                { value: 24, label: '最近 24 小时' },
                { value: 168, label: '最近 7 天' },
              ]}
              style={{ width: 150 }}
            />
            <Select
              value={route}
              onChange={setRoute}
              options={data.facets.routes.map((item) => ({ value: item, label: item }))}
              placeholder="路由"
              allowClear
              style={selectStyle}
            />
            <Select
              value={device}
              onChange={setDevice}
              options={data.facets.devices.map((item) => ({ value: item, label: item }))}
              placeholder="设备"
              allowClear
              style={selectStyle}
            />
            <Select
              value={network}
              onChange={setNetwork}
              options={data.facets.networks.map((item) => ({ value: item, label: item }))}
              placeholder="网络"
              allowClear
              style={selectStyle}
            />
            <Select
              value={release}
              onChange={setRelease}
              options={data.facets.releases.map((item) => ({ value: item, label: item }))}
              placeholder="版本"
              allowClear
              style={selectStyle}
            />
            <Select
              value={event}
              onChange={setEvent}
              options={data.facets.events.map((item) => ({ value: item, label: item }))}
              placeholder="事件"
              allowClear
              style={selectStyle}
            />
            <Button icon={<ReloadOutlined />} onClick={() => void loadData()}>
              刷新
            </Button>
          </Space>
        </div>

        {error && <Alert type="error" message={error} showIcon />}

        <div className={styles.metrics}>
          {featuredMetrics.map((metric) => (
            <div className={styles.metric} key={metric.label}>
              <span>{metric.label}</span>
              <strong>{metric.value}</strong>
              {metric.rating && (
                <Tag color={RATING_COLOR[metric.rating] ?? 'default'}>{metric.rating}</Tag>
              )}
            </div>
          ))}
          <div className={styles.metric}>
            <span>样本置信度</span>
            <strong>{data.totals.confidence}</strong>
            <Tag color={CONFIDENCE_COLOR[data.totals.confidence] ?? 'default'}>
              {data.totals.confidence}
            </Tag>
          </div>
        </div>

        <section className={styles.section}>
          <h2>指标 P75</h2>
          <Table<PerformanceSummaryItem>
            rowKey={(record) =>
              `${record.event}-${record.metric_name}-${record.route}-${record.device_type}-${record.network_type}-${record.release}`
            }
            columns={summaryColumns}
            dataSource={data.summary}
            pagination={{ pageSize: 8 }}
            size="middle"
          />
        </section>

        <section className={styles.section}>
          <h2>慢事件 Top 10</h2>
          <Table<PerformanceSlowItem>
            rowKey={(record) => `${record.event}-${record.metric_name}-${record.timestamp}`}
            columns={slowColumns}
            dataSource={data.slow}
            pagination={false}
            size="middle"
          />
        </section>
      </div>
    </MainContent>
  );
}
