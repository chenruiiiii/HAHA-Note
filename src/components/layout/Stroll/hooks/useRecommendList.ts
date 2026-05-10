import { getStrollRecommend } from '@/services/stroll-recommend';
import { useCallback, useState } from 'react';
import { RecommendDetailType } from '../types/recommend';

export function useRecommendList() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const [list, setList] = useState<RecommendDetailType[]>([]);

  // 加载数据
  const loadData = useCallback(async () => {
    setIsLoading(true);
    const res = await getStrollRecommend();
    // 根据返回的code , data 处理数据
    if (res.code === 200) {
      setList(res.data);
    } else {
      setError(res.data);
    }
    setIsLoading(false);
  }, []);

  return { isLoading, loadData, error, list };
}
