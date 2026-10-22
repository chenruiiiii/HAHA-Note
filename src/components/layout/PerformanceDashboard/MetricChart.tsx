'use client';

import { BarChart } from 'echarts/charts';
import { GridComponent, TooltipComponent } from 'echarts/components';
import {
  init,
  use as registerECharts,
  type EChartsCoreOption,
  type EChartsType,
} from 'echarts/core';
import { CanvasRenderer } from 'echarts/renderers';
import { useEffect, useMemo, useRef } from 'react';

registerECharts([BarChart, GridComponent, TooltipComponent, CanvasRenderer]);

export interface MetricChartDatum {
  name: string;
  value: number;
  color: string;
}

interface MetricChartProps {
  data: MetricChartDatum[];
  unit: 'ms' | 'score';
  height?: number;
}

function formatValue(value: number, unit: MetricChartProps['unit']) {
  if (unit === 'score') {
    return value.toFixed(3);
  }

  return value >= 1000 ? `${(value / 1000).toFixed(2)}s` : `${value}ms`;
}

export default function MetricChart({ data, unit, height = 176 }: MetricChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<EChartsType | null>(null);

  const option = useMemo<EChartsCoreOption>(
    () => ({
      animation: false,
      grid: {
        left: 52,
        right: 16,
        top: 14,
        bottom: 28,
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        valueFormatter: (value: unknown) =>
          typeof value === 'number' ? formatValue(value, unit) : '-',
      },
      xAxis: {
        type: 'category',
        data: data.map((item) => item.name),
        axisTick: { show: false },
        axisLine: { lineStyle: { color: '#e5e7eb' } },
        axisLabel: { color: '#6b7280', fontSize: 12 },
      },
      yAxis: {
        type: 'value',
        min: 0,
        axisLabel: {
          color: '#6b7280',
          fontSize: 12,
          formatter: (value: number) => formatValue(value, unit),
        },
        splitLine: { lineStyle: { color: '#f1f5f9' } },
      },
      series: [
        {
          type: 'bar',
          barMaxWidth: 28,
          data: data.map((item) => ({
            value: item.value,
            itemStyle: { color: item.color, borderRadius: [4, 4, 0, 0] },
          })),
        },
      ],
    }),
    [data, unit]
  );

  useEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return;
    }

    const chart = init(container);
    chartRef.current = chart;

    const resize = () => chart.resize();
    const observer =
      typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(resize);
    observer?.observe(container);
    window.addEventListener('resize', resize);

    return () => {
      observer?.disconnect();
      window.removeEventListener('resize', resize);
      chart.dispose();
      chartRef.current = null;
    };
  }, []);

  useEffect(() => {
    chartRef.current?.setOption(option, { notMerge: true });
  }, [option]);

  return <div ref={containerRef} style={{ height, width: '100%' }} />;
}
