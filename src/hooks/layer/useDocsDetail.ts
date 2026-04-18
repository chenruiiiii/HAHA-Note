import { DocumentDetail } from '@/models/docs';
import { getDocsDetailData } from '@/services/docs-detail';
import { useCallback, useEffect, useState } from 'react';

export default function useDocsDetail(docsId?: string) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const [data, setData] = useState<DocumentDetail | null>(null);

  const getDocsDetail = useCallback(async () => {
    if (!docsId) {
      setData(null);
      setError(new Error('docsId is required'));
      return null;
    }

    try {
      setIsLoading(true);
      setError(null);
      const res = await getDocsDetailData(docsId);

      if (res.code === 200) {
        setData(res.data);
        return res.data;
      }

      setData(null);
      setError(new Error(res.message || '获取文档详情失败'));
      return null;
    } catch (err) {
      setData(null);
      setError(err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [docsId]);

  useEffect(() => {
    void getDocsDetail();
  }, [getDocsDetail]);

  return {
    isLoading,
    error,
    data,
    getDocsDetail,
  };
}
