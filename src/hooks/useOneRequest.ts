import { useRef } from 'react';

export function useOneRequest() {
  const requestMap = useRef<Map<string, number>>(new Map());
  const timestamp = 5 * 60 * 1000;

  // 检查请求是否重复
  const checkDuplicate = (url: string, data?: any) => {
    const key = `${url}-${JSON.stringify(data || {})}`;
    const now = Date.now();
    const lastTime = requestMap.current.get(key);

    if (lastTime && now - lastTime < timestamp) {
      // 请求重复
      return false;
    } else {
      // 不重复
      recordRequest(url, data);
      return true;
    }
  };

  // 记录请求
  const recordRequest = (url: string, data?: any) => {
    const key = `${url}-${JSON.stringify(data || {})}`;
    requestMap.current.set(key, Date.now());

    // 自动清除旧记录
    setTimeout(() => {
      requestMap.current.delete(key);
    }, timestamp);
  };

  return { recordRequest, checkDuplicate };
}
