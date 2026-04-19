import { getCollectMissionList, getLatestMissionList } from '@/services/chat-mission';
import type { ListItem } from '@/models/ai-mission';
import { useCallback, useEffect, useState } from 'react';

export type ChatMissionAlign = '最近任务' | '收藏任务';

export default function useChatMissionList(alignValue: ChatMissionAlign) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [data, setData] = useState<ListItem[]>([]);

  const getMissionList = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const res =
        alignValue === '最近任务' ? await getLatestMissionList() : await getCollectMissionList();

      if (res.code === 200) {
        setData(res.data ?? []);
        return res.data;
      }

      setData([]);
      setError(new Error(res.message || '获取任务列表失败'));
      return [];
    } catch (err) {
      setData([]);
      setError(err instanceof Error ? err : new Error('获取任务列表失败'));
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [alignValue]);

  useEffect(() => {
    void getMissionList();
  }, [getMissionList]);

  return {
    isLoading,
    error,
    data,
    getMissionList,
  };
}
