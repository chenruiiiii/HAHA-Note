import { getStrollRecommend } from '@/services/stroll-recommend';
import { useState } from 'react';
import { RecommendDetailType } from '../types/recommend';

export function useRecommendList(isLeft: boolean) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<any>(null);
  const [list, setList] = useState<RecommendDetailType[]>([]);

  // 加载数据
  const loadData = async (page: number, limit: number) => {
    setIsLoading(true);
    // isLeft ? 获取左列表数据 : 获取右列表数据
    const res = isLeft ? await getStrollRecommend(page, limit) : await getStrollRecommend(1, 10);
    // 根据返回的code , data 处理数据
    if (res.code === 200) {
      setList(res.data);
    } else {
      setError(res.data);
    }
    setIsLoading(false);
  };

  return { isLoading, loadData, error, list };
}
