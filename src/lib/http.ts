import axios, {
  AxiosError,
  AxiosRequestConfig,
  InternalAxiosRequestConfig,
} from 'axios';

const instance = axios.create({
  baseURL: '/',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

instance.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    config.headers.set('Accept', 'application/json');
    return config;
  },
  (error: AxiosError) => Promise.reject(error)
);

instance.interceptors.response.use(
  (response) => response.data,
  (error: AxiosError<{ message?: string }>) => {
    const status = error.response?.status;
    const message =
      error.response?.data?.message ||
      (status === 401
        ? '登录状态已失效，请重新登录'
        : status === 403
          ? '暂无权限访问该资源'
          : status === 404
            ? '请求的资源不存在'
            : error.message || '请求失败，请稍后重试');

    return Promise.reject(new Error(message));
  }
);

const http = {
  get: <T>(url: string, config?: AxiosRequestConfig) =>
    instance.get<unknown, T>(url, config),
  post: <T>(url: string, data?: unknown, config?: AxiosRequestConfig) =>
    instance.post<unknown, T>(url, data, config),
};

export default http;
