import { DocumentDetail } from '@/models/docs';
import { getDocsDetailData } from '@/services/docs-detail';
import { AxiosError } from 'axios';
import { useCallback, useEffect, useState } from 'react';

export default function useDocsDetail(docsId?: string, repositoryId?: string) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const [data, setData] = useState<DocumentDetail | null>(null);
  const [isDraft, setIsDraft] = useState(false);

  const getDocsDetail = useCallback(async () => {
    if (!docsId) {
      setData(null);
      setError(new Error('docsId is required'));
      setIsDraft(false);
      return null;
    }

    try {
      setIsLoading(true);
      setError(null);
      const res = await getDocsDetailData(docsId);

      if (res.code === 200) {
        setData(res.data);
        setIsDraft(false);
        return res.data;
      }

      setData(null);
      setError(new Error(res.message || '获取文档详情失败'));
      setIsDraft(false);
      return null;
    } catch (err) {
      const requestError = err as AxiosError<{ message?: string }>;

      if (requestError.response?.status === 404) {
        const draftDoc: DocumentDetail = {
          _id: docsId,
          repository_id: repositoryId ?? '',
          title: '新建文档',
          content_html: '',
          author: '',
          updated_at: '',
        };

        setData(draftDoc);
        setError(null);
        setIsDraft(true);
        return draftDoc;
      }

      setData(null);
      setError(err);
      setIsDraft(false);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [docsId, repositoryId]);

  useEffect(() => {
    void getDocsDetail();
  }, [getDocsDetail]);

  return {
    isLoading,
    error,
    data,
    isDraft,
    getDocsDetail,
  };
}
