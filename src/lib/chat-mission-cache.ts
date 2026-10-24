import type { ListItem } from '@/models/ai-mission';

export type ChatMissionCacheKey = 'recent' | 'favorite';

interface ChatMissionCacheEntry {
  data: ListItem[] | null;
  dirty: boolean;
  revision: number;
  inFlight: Promise<ListItem[]> | null;
  inFlightRevision: number | null;
}

const cache: Record<ChatMissionCacheKey, ChatMissionCacheEntry> = {
  recent: {
    data: null,
    dirty: true,
    revision: 0,
    inFlight: null,
    inFlightRevision: null,
  },
  favorite: {
    data: null,
    dirty: true,
    revision: 0,
    inFlight: null,
    inFlightRevision: null,
  },
};

/**
 * 读取当前会话内仍有效的任务列表。dirty 时返回 null，由调用方重新请求。
 */
export function getCachedChatMissionList(key: ChatMissionCacheKey): ListItem[] | null {
  const entry = cache[key];
  return entry.dirty ? null : entry.data;
}

/**
 * 优先复用缓存；缓存失效时加载并写入缓存，同一分组的并发请求会共享结果。
 */
export function loadChatMissionList(
  key: ChatMissionCacheKey,
  loader: () => Promise<ListItem[]>
): Promise<ListItem[]> {
  const cached = getCachedChatMissionList(key);

  if (cached !== null) {
    return Promise.resolve(cached);
  }

  const entry = cache[key];

  if (entry.inFlight && entry.inFlightRevision === entry.revision) {
    return entry.inFlight;
  }

  const revision = entry.revision;
  const request = loader()
    .then((data) => {
      // 请求期间发生过失效时，旧响应不能重新覆盖已经变脏的缓存。
      if (entry.revision === revision) {
        entry.data = data;
        entry.dirty = false;
      }

      return data;
    })
    .finally(() => {
      // 只清理属于本次请求的 inFlight，避免误删后续请求。
      if (entry.inFlight === request && entry.inFlightRevision === revision) {
        entry.inFlight = null;
        entry.inFlightRevision = null;
      }
    });

  entry.inFlight = request;
  entry.inFlightRevision = revision;

  return request;
}

/**
 * 新建会话等数据变更场景调用。下一次读取时会重新请求一次。
 */
export function invalidateChatMissionCache(): void {
  Object.values(cache).forEach((entry) => {
    entry.dirty = true;
    entry.revision += 1;
  });
}

/**
 * 删除成功后同步移除两个分组中的会话，避免重新打开列表时继续展示已删除项。
 */
export function removeChatMissionFromCache(chatId: string): void {
  Object.values(cache).forEach((entry) => {
    entry.revision += 1;

    if (entry.data) {
      entry.data = entry.data.filter((item) => item.docs_id !== chatId);
    }
  });
}

/**
 * 测试和显式重置使用；不会保留任何列表数据。
 */
export function clearChatMissionCache(): void {
  Object.values(cache).forEach((entry) => {
    entry.data = null;
    entry.dirty = true;
    entry.revision += 1;
    entry.inFlight = null;
    entry.inFlightRevision = null;
  });
}
