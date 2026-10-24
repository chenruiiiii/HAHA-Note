import {
  deleteChatMission,
  getCollectMissionList,
  getLatestMissionList,
} from '@/services/chat-mission';
import {
  getCachedChatMissionList,
  loadChatMissionList,
  removeChatMissionFromCache,
  type ChatMissionCacheKey,
} from '@/lib/chat-mission-cache';
import type { ListItem } from '@/models/ai-mission';
import { useCallback, useEffect, useState } from 'react';

export type ChatMissionAlign = '最近任务' | '收藏任务';

function getCacheKey(alignValue: ChatMissionAlign): ChatMissionCacheKey {
  return alignValue === '最近任务' ? 'recent' : 'favorite';
}

export default function useChatMissionList(alignValue: ChatMissionAlign) {
  const cacheKey = getCacheKey(alignValue);
  const [isLoading, setIsLoading] = useState(() => getCachedChatMissionList(cacheKey) === null);
  const [error, setError] = useState<Error | null>(null);
  const [data, setData] = useState<ListItem[]>(() => getCachedChatMissionList(cacheKey) ?? []);

  const getMissionList = useCallback(async () => {
    const cached = getCachedChatMissionList(cacheKey);

    if (cached !== null) {
      setData(cached);
      setError(null);
      setIsLoading(false);
      return cached;
    }

    try {
      setIsLoading(true);
      setError(null);

      const missionList = await loadChatMissionList(cacheKey, async () => {
        const res =
          cacheKey === 'recent' ? await getLatestMissionList() : await getCollectMissionList();

        if (res.code !== 200) {
          throw new Error(res.message || '获取任务列表失败');
        }

        return res.data ?? [];
      });

      setData(missionList);
      return missionList;
    } catch (err) {
      setData([]);
      setError(err instanceof Error ? err : new Error('获取任务列表失败'));
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [cacheKey]);

  const deleteMission = useCallback(async (chatId: string) => {
    const response = await deleteChatMission(chatId);

    if (response.code !== 200) {
      throw new Error(response.message || '删除对话失败');
    }

    removeChatMissionFromCache(chatId);
    setData((current) => current.filter((item) => item.docs_id !== chatId));
  }, []);

  useEffect(() => {
    // 缓存命中时不会发请求；仅首次读取、分组切换或数据失效时才同步远端列表。
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void getMissionList();
  }, [getMissionList]);

  return {
    isLoading,
    error,
    data,
    getMissionList,
    deleteMission,
  };
}
