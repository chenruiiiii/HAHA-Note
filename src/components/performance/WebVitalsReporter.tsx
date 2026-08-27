'use client';

import { trackPerformance } from '@/lib/performance';
import { useReportWebVitals } from 'next/web-vitals';

interface WebVitalMetric {
  id: string;
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
}

function reportWebVital(metric: WebVitalMetric) {
  trackPerformance('web_vital', {
    metric_name: metric.name,
    metric_id: metric.id,
    value: Number(metric.value.toFixed(2)),
    rating: metric.rating,
  });
}

export default function WebVitalsReporter() {
  useReportWebVitals(reportWebVital);
  return null;
}
