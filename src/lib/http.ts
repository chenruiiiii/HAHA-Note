import axios, { AxiosError, AxiosRequestConfig, InternalAxiosRequestConfig } from 'axios';
import { getBudget, rateMetric, trackPerformance } from '@/lib/performance';

// NEXT_PUBLIC_APP_API_URL 约定为 API origin（须以 /api 结尾）。
// 未配置或缺少 /api 后缀时自动规整，避免相对路径的 API 调用
// 打到页面路由（如 POST /login）从而被 Next.js 返回 405。
const rawBaseUrl = process.env.NEXT_PUBLIC_APP_API_URL;
const baseURL = rawBaseUrl
  ? rawBaseUrl.endsWith('/api')
    ? rawBaseUrl
    : `${rawBaseUrl.replace(/\/+$/, '')}/api`
  : '/api';

const TIME_OUT = 10000;
const refreshEndpoint = `${baseURL}/auth/refresh`;

interface RetryableAxiosRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
  _haStartedAt?: number;
}

function getRequestPath(url?: string) {
  if (!url) {
    return 'unknown';
  }

  try {
    return new URL(url, baseURL || window.location.origin).pathname;
  } catch {
    return url.split('?')[0];
  }
}

function getDuration(startedAt?: number) {
  if (!startedAt || typeof performance === 'undefined') {
    return undefined;
  }

  return Math.round(performance.now() - startedAt);
}

function reportApiPerformance(
  config: RetryableAxiosRequestConfig | undefined,
  success: boolean,
  statusCode?: number,
  errorType?: string
) {
  if (typeof window === 'undefined' || !config) {
    return;
  }

  const duration = getDuration(config._haStartedAt);

  if (typeof duration !== 'number') {
    return;
  }

  const budget = getBudget('api_request_ms', 'api_request_completed');

  trackPerformance('api_request_completed', {
    route: getRequestPath(config.url),
    metric_name: 'api_request_ms',
    duration_ms: duration,
    value: duration,
    rating: rateMetric(duration, budget),
    success,
    status_code: statusCode,
    method: config.method,
    error_type: errorType,
  });
}

const instance = axios.create({
  baseURL,
  timeout: TIME_OUT,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

let refreshPromise: Promise<unknown> | null = null;

async function refreshAccessToken() {
  if (!refreshPromise) {
    refreshPromise = axios.post(refreshEndpoint, undefined, {
      withCredentials: true,
      timeout: TIME_OUT,
      headers: {
        Accept: 'application/json',
      },
    });

    refreshPromise.finally(() => {
      refreshPromise = null;
    });
  }

  return refreshPromise;
}

instance.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // 可以在这里统一注入 Token
    // const token = localStorage.getItem('token');
    // if (token) config.headers.Authorization = `Bearer ${token}`;

    config.headers.set('Accept', 'application/json');
    if (typeof performance !== 'undefined') {
      (config as RetryableAxiosRequestConfig)._haStartedAt = performance.now();
    }
    return config;
  },
  (error: AxiosError) => Promise.reject(error)
);

instance.interceptors.response.use(
  (response) => {
    reportApiPerformance(
      response.config as RetryableAxiosRequestConfig,
      true,
      response.status
    );
    return response.data;
  },
  (error: AxiosError<{ message?: string }>) => {
    const originalRequest = error.config as RetryableAxiosRequestConfig | undefined;
    const status = error.response?.status;
    let message = '';

    if (
      status === 401 &&
      originalRequest &&
      !originalRequest._retry &&
      originalRequest.url !== '/auth/refresh'
    ) {
      originalRequest._retry = true;

      return refreshAccessToken()
        .then(() => instance(originalRequest))
        .catch((refreshError) => {
          if (typeof window !== 'undefined') {
            const redirect = `${window.location.pathname}${window.location.search}`;
            window.location.href = `/login?redirect=${encodeURIComponent(redirect)}`;
          }

          return Promise.reject(refreshError);
        });
    }

    if (error.code === 'ECONNABORTED' && error.message.includes('timeout')) {
      message = '网络请求超时，请检查网络后再试';
    } else {
      switch (status) {
        case 401:
          message = '登录状态已失效，请重新登录';
          break;
        case 403:
          message = '暂无权限访问该资源';
          break;
        case 404:
          message = '请求的资源不存在';
          break;
        case 500:
          message = '服务器内部错误';
          break;
        case 502:
          message = '网关错误';
          break;
        default:
          message = error.response?.data?.message || error.message || '请求失败';
      }
    }

    // 这里可以结合你 UI 库的 Message 组件直接弹出错误提示
    // message.error(message);
    console.error(`[API Error ${status}]:`, message);
    reportApiPerformance(originalRequest, false, status, error.code || 'api_error');

    return Promise.reject(error); // 记得把 error 抛出，方便业务逻辑单独 catch
  }
);

const http = {
  get: <T>(url: string, config?: AxiosRequestConfig): Promise<T> =>
    instance.get(url, config).then((response) => response.data),

  post: <T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> =>
    instance.post(url, data, config).then((response) => response.data),

  delete: <T>(url: string, config?: AxiosRequestConfig): Promise<T> =>
    instance.delete(url, config).then((response) => response.data),

  put: <T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> =>
    instance.put(url, data, config).then((response) => response.data),

  // 额外增加一个 patch，很多 RESTful 接口会用到
  patch: <T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> =>
    instance.patch(url, data, config).then((response) => response.data),
};

export default http;
