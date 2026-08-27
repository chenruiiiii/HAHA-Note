// 请求去重工具（5 分钟窗口）：同一 key 在窗口内再次出现视为重复。
// 模块级实现，非 React hook，可在事件处理器中安全调用。

const requestMap = new Map<string, number>();
const timestamp = 5 * 60 * 1000;

/**
 * 检查请求是否重复（同一 key 在 5 分钟内再次出现视为重复）。
 *
 * @param url - 请求标识（如消息内容）。
 * @param data - 附加参数，参与 key 计算。
 * @returns 重复返回 `true`，不重复返回 `false` 并记录本次请求。
 */
export function checkDuplicate(url: string, data?: unknown): boolean {
  const key = `${url}-${JSON.stringify(data || {})}`;
  const now = Date.now();
  const lastTime = requestMap.get(key);

  if (lastTime && now - lastTime < timestamp) {
    // 请求重复
    return true;
  }

  // 不重复
  recordRequest(url, data);
  return false;
}

/**
 * 记录一次请求。
 *
 * @param url - 请求标识（如消息内容）。
 * @param data - 附加参数，参与 key 计算。
 */
export function recordRequest(url: string, data?: unknown): void {
  const key = `${url}-${JSON.stringify(data || {})}`;
  requestMap.set(key, Date.now());

  // 自动清除旧记录
  setTimeout(() => {
    requestMap.delete(key);
  }, timestamp);
}
