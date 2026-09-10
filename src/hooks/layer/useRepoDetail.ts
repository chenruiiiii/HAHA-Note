import { getRepoDetailData, normalizeRepoDetailData } from '@/services/repo-detail';
import { RepoDetailType } from '@/components/layout/Repository/types';
import { useCallback, useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAppDispatch, useAppSelector } from '@/store';
import {
  REPO_DETAIL_CACHE_TTL,
  setRepoDetailCacheAction,
  setRepoDetailDocLoadingAction,
} from '@/store/modules/repoDetail';

const repoDetailRequestMap = new Map<string, Promise<RepoDetailType | null>>();

export default function useRepoDetail(repoId?: string) {
  const router = useRouter();
  const pathname = usePathname();
  const dispatch = useAppDispatch();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const [data, setData] = useState<RepoDetailType | null>(null);
  const cachedRepoDetail = useAppSelector((state) =>
    repoId ? state.repoDetail.cacheById[repoId] : undefined
  );

  const getRepoDetail = useCallback(async () => {
    if (!repoId) {
      setData(null);
      setError(new Error('repoId is required'));
      return;
    }

    if (cachedRepoDetail) {
      const isLegacyCache =
        !('title' in cachedRepoDetail.data) || !('creator' in cachedRepoDetail.data);
      const isCacheValid = Date.now() - cachedRepoDetail.timestamp < REPO_DETAIL_CACHE_TTL;

      if (!isLegacyCache) {
        setData(cachedRepoDetail.data);
        setError(null);
      }

      if (isCacheValid && !isLegacyCache) {
        return cachedRepoDetail.data;
      }
    }

    const currentRequest = repoDetailRequestMap.get(repoId);
    if (currentRequest) {
      setIsLoading(true);
      try {
        const requestData = await currentRequest;
        setData(requestData);
        return requestData;
      } catch (err) {
        setError(err);
        return null;
      } finally {
        setIsLoading(false);
      }
    }

    try {
      setIsLoading(true);
      setError(null);
      const request = (async () => {
        const res = await getRepoDetailData(repoId);

        if (res.code === 200) {
          const normalizedRepoDetail = normalizeRepoDetailData(res.data);
          dispatch(
            setRepoDetailCacheAction({
              id: normalizedRepoDetail._id,
              data: normalizedRepoDetail,
            })
          );
          return normalizedRepoDetail;
        }

        throw new Error(res.message || '获取知识库详情失败');
      })();
      repoDetailRequestMap.set(repoId, request);
      const repoDetail = await request;
      setData(repoDetail);
      return repoDetail;
    } catch (err) {
      setError(err);
      if (!cachedRepoDetail) {
        setData(null);
      }
      return null;
    } finally {
      repoDetailRequestMap.delete(repoId);
      setIsLoading(false);
    }
  }, [cachedRepoDetail, dispatch, repoId]);

  useEffect(() => {
    void getRepoDetail();
  }, [getRepoDetail]);

  const handleToDetail = useCallback(
    (id: string) => {
      if (!repoId) return;
      const targetPath = `/repo-detail/${repoId}/${id}`;
      if (pathname === targetPath) return;

      dispatch(setRepoDetailDocLoadingAction({ docsId: id, isLoading: true }));
      router.push(targetPath);
    },
    [dispatch, pathname, repoId, router]
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
