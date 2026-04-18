import { getRepoDetailData } from '@/services/repo-detail';
import { RepoDetailType } from '@/components/layout/Repository/types';
import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function useRepoDetail(repoId?: string) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const [data, setData] = useState<RepoDetailType | null>(null);

  const getRepoDetail = useCallback(async () => {
    if (!repoId) {
      setData(null);
      setError(new Error('repoId is required'));
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const res = await getRepoDetailData(repoId);

      if (res.code === 200) {
        setData(res.data);
        return res.data;
      }

      setData(null);
      setError(new Error(res.message || '获取知识库详情失败'));
      return null;
    } catch (err) {
      setData(null);
      setError(err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [repoId]);

  useEffect(() => {
    void getRepoDetail();
  }, [getRepoDetail]);

  const handleToDetail = useCallback(
    (id: string) => {
      if (!repoId) return;
      router.push(`/repo-detail/${repoId}/${id}`);
    },
    [repoId, router]
  );

  const handleToHome = useCallback(
    (isHome: boolean) => {
      if (isHome && repoId) {
        router.push(`/repo-detail/${repoId}/home`);
        return;
      }

      router.push('/repository');
    },
    [repoId, router]
  );

  return {
    isLoading,
    error,
    data,
    getRepoDetail,
    handleToDetail,
    handleToHome,
  };
}
