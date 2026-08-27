export type DeviceType = 'mobile' | 'tablet' | 'desktop' | 'unknown';
export type NetworkType = 'slow-2g' | '2g' | '3g' | '4g' | '5g' | 'wifi' | 'unknown';

export type PerformanceEventName =
  | 'web_vital'
  | 'api_request_completed'
  | 'note_open_completed'
  | 'note_save_completed'
  | 'search_completed'
  | 'editor_ready'
  | 'ai_generation_started'
  | 'ai_first_token'
  | 'ai_generation_completed'
  | 'ai_generation_cancelled'
  | 'ai_generation_failed';

export type PerformanceRating = 'good' | 'needs-improvement' | 'poor' | 'unknown';
export type PerformanceConfidence = 'reliable' | 'insufficient';

export interface PerformanceMetricPayload {
  event: PerformanceEventName;
  route?: string;
  metric_name?: string;
  metric_id?: string;
  value?: number;
  duration_ms?: number;
  rating?: PerformanceRating | string;
  success?: boolean;
  error_type?: string;
  retry_count?: number;
  first_token_ms?: number | null;
  total_ms?: number;
  status_code?: number;
  method?: string;
  release?: string;
  device_type?: DeviceType;
  network_type?: NetworkType;
  timestamp?: string;
}

export interface PerformanceSummaryItem {
  event: string;
  metric_name?: string;
  route: string;
  count: number;
  samples: number;
  avg: number;
  p50: number;
  p75: number;
  p95: number;
  budget?: number;
  rating: PerformanceRating;
  confidence: PerformanceConfidence;
  device_type: DeviceType;
  network_type: NetworkType;
  release: string;
}

export interface PerformanceSlowItem {
  event: string;
  route: string;
  duration_ms: number;
  metric_name?: string;
  timestamp: string;
  success?: boolean;
}

export interface PerformanceDashboardData {
  summary: PerformanceSummaryItem[];
  slow: PerformanceSlowItem[];
  totals: {
    count: number;
    ai_success_rate: number | null;
    api_success_rate: number | null;
    confidence: PerformanceConfidence;
  };
  facets: {
    routes: string[];
    devices: DeviceType[];
    networks: NetworkType[];
    releases: string[];
    events: PerformanceEventName[];
  };
}
