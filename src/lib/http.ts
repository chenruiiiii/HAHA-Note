import axios, { AxiosError, AxiosRequestConfig, InternalAxiosRequestConfig } from 'axios';
import { getBudget, rateMetric, trackPerformance } from '@/lib/performance';
import type { ResponseData } from '@/types/response';

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

/** 判断业务响应体是否携带"未登录/登录过期"标记（HTTP 200 + code 401）。 */
function isBusinessUnauthorized(data: unknown): boolean {
  if (typeof data !== 'object' || data === null) {
    return false;
  }

  // 兼容 code 为数字 401 或字符串 '401' 两种形态
  return Number((data as ResponseData<unknown>).code) === 401;
}

/**
 * 统一的"刷新登录态"入口：并发 401 共享同一个刷新请求（避免重复刷新），
 * 刷新成功后由调用方重试原请求。axios 拦截器与 AI 聊天流（原生 fetch）
 * 两个通道共用，保证任意接口 401 时都能无感刷新。
 */
export async function refreshAuthSession(): Promise<unknown> {
  if (!refreshPromise) {
    refreshPromise = axios
      .post(refreshEndpoint, undefined, {
        withCredentials: true,
        timeout: TIME_OUT,
        headers: {
          Accept: 'application/json',
        },
      })
      .then((response) => {
        // 刷新接口也可能返回"HTTP 200 + 业务 code=401"：此时登录态已彻底失效，
        // 统一按刷新失败处理，由调用方决定跳转，避免被当成成功静默放行。
        if (isBusinessUnauthorized(response.data)) {
          throw new AxiosError(
            (response.data as ResponseData<unknown>).message ||
              '登录状态已失效，请重新登录',
            'ERR_UNAUTHORIZED',
            undefined,
            response
          );
        }

        return response.data;
      });

    refreshPromise.finally(() => {
      refreshPromise = null;
    });
  }

  return refreshPromise;
}

/** 未登录 / 登录态彻底失效：保留当前页面路径与查询参数跳转登录页。 */
export function redirectToLogin(): void {
  if (typeof window === 'undefined') {
    return;
  }

  const redirect = `${window.location.pathname}${window.location.search}`;
  window.location.href = `/login?redirect=${encodeURIComponent(redirect)}`;
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
    reportApiPerformance(response.config as RetryableAxiosRequestConfig, true, response.status);

    const originalRequest = response.config as RetryableAxiosRequestConfig;
    const businessUnauthorized =
      isBusinessUnauthorized(response.data) && originalRequest.url !== '/auth/refresh';

    // 兼容"HTTP 200 但业务 code=401"的登录态失效：复用与 HTTP 401 一致的
    // 刷新 + 重试 + 跳转流程，保证两种通道行为统一。
    if (businessUnauthorized) {
      if (!originalRequest._retry) {
        originalRequest._retry = true;

        return refreshAuthSession()
          .then(() => instance(originalRequest))
          .catch((refreshError) => {
            redirectToLogin();
            return Promise.reject(refreshError);
          });
      }

      // 已重试过一次仍然业务 401：登录态彻底失效，跳转并将错误抛给业务侧
      // （避免把 code=401 的数据静默当作成功返回）。
      const message =
        (response.data as ResponseData<unknown>).message ||
        '登录状态已失效，请重新登录';
      redirectToLogin();
      console.error('[API Error 401]:', message);
      reportApiPerformance(originalRequest, false, 401, 'business_unauthorized');
      return Promise.reject(
        new AxiosError(message, 'ERR_UNAUTHORIZED', originalRequest, response.request, response)
      );
    }

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

      return refreshAuthSession()
        .then(() => instance(originalRequest))
        .catch((refreshError) => {
          redirectToLogin();
          return Promise.reject(refreshError);
        });
    }

    // 走到这里仍为 401 的只剩两类：刷新后重试依然 401（登录态彻底失效），
    // 或刷新接口自身 401。两种都必须跳转登录，不能静默放行。
    if (status === 401) {
      redirectToLogin();
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

/**
 * 响应拦截器已经直接返回 `response.data`，这里只负责把类型收敛成业务数据类型。
 *
 * 不再使用 `instance.get<T, T>()`：axios 1.19 起第二个泛型不再是返回类型，
 * 未绑定的条件类型 `AxiosResponseResult<T, T, ...>` 无法赋给 `Promise<T>`。
 */
const unwrap = <T>(promise: Promise<unknown>): Promise<T> => promise as Promise<T>;

const http = {
  get: <T>(url: string, config?: AxiosRequestConfig): Promise<T> =>
    unwrap<T>(instance.get(url, config)),

  post: <T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> =>
    unwrap<T>(instance.post(url, data, config)),

  delete: <T>(url: string, config?: AxiosRequestConfig): Promise<T> =>
    unwrap<T>(instance.delete(url, config)),

  put: <T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> =>
    unwrap<T>(instance.put(url, data, config)),

  // 额外增加一个 patch，很多 RESTful 接口会用到
  patch: <T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> =>
    unwrap<T>(instance.patch(url, data, config)),
};

export default http;
