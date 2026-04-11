import axios, { AxiosError, AxiosRequestConfig, InternalAxiosRequestConfig } from 'axios';

const baseURL = process.env.NEXT_PUBLIC_APP_API_URL;

const TIME_OUT = 10000;

const instance = axios.create({
  baseURL,
  timeout: TIME_OUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

instance.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // 可以在这里统一注入 Token
    // const token = localStorage.getItem('token');
    // if (token) config.headers.Authorization = `Bearer ${token}`;

    config.headers.set('Accept', 'application/json');
    return config;
  },
  (error: AxiosError) => Promise.reject(error)
);

instance.interceptors.response.use(
  (response) => response.data,
  (error: AxiosError<{ message?: string }>) => {
    const status = error.response?.status;
    let message = '';

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

    return Promise.reject(error); // 记得把 error 抛出，方便业务逻辑单独 catch
  }
);

const http = {
  get: <T>(url: string, config?: AxiosRequestConfig): Promise<T> => instance.get(url, config),

  post: <T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> =>
    instance.post(url, data, config),

  delete: <T>(url: string, config?: AxiosRequestConfig): Promise<T> => instance.delete(url, config),

  put: <T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> =>
    instance.put(url, data, config),

  // 额外增加一个 patch，很多 RESTful 接口会用到
  patch: <T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> =>
    instance.patch(url, data, config),
};

export default http;
