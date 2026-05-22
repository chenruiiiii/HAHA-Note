import { DocumentDetail } from '@/models/docs';
import { getDocsDetailData } from '@/services/docs-detail';
import { AxiosError } from 'axios';
import { useCallback, useEffect, useRef, useState } from 'react';

const createDraftDoc = (docsId: string, repositoryId = '', title = '新建文档'): DocumentDetail => ({
  _id: docsId,
  repository_id: repositoryId,
  title,
  content_html: '',
  summary: '',
  author: '',
  updated_at: '',
});

export default function useDocsDetail(docsId?: string, repositoryId?: string, draftTitle?: string) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const [data, setData] = useState<DocumentDetail | null>(null);
  const [isDraft, setIsDraft] = useState(false);
  const [isRepositoryMismatch, setIsRepositoryMismatch] = useState(false);
  const draftTitleRef = useRef(draftTitle);

  useEffect(() => {
    draftTitleRef.current = draftTitle;
  }, [draftTitle]);

  useEffect(() => {
    if (!isRepositoryMismatch || !draftTitle) return;

    setData((currentData) => {
      if (!currentData || currentData.title === draftTitle) return currentData;

      return {
        ...currentData,
        title: draftTitle,
      };
    });
  }, [draftTitle, isRepositoryMismatch]);

  const getDocsDetail = useCallback(async () => {
    if (!docsId) {
      setData(null);
      setError(new Error('docsId is required'));
      setIsDraft(false);
      setIsRepositoryMismatch(false);
      return null;
    }

    try {
      setIsLoading(true);
      setError(null);
      const res = await getDocsDetailData(docsId);

      if (res.code === 200) {
        if (repositoryId && res.data.repository_id !== repositoryId) {
          const draftDoc = createDraftDoc(docsId, repositoryId, draftTitleRef.current);

          setData(draftDoc);
          setError(null);
          setIsDraft(true);
          setIsRepositoryMismatch(true);
          return draftDoc;
        }

        setData(res.data);
        setIsDraft(false);
        setIsRepositoryMismatch(false);
        return res.data;
      }

      if (res.code === 404) {
        const draftDoc = createDraftDoc(docsId, repositoryId, draftTitleRef.current);

        setData(draftDoc);
        setError(null);
        setIsDraft(true);
        setIsRepositoryMismatch(false);
        return draftDoc;
      }

      setData(null);
      setError(new Error(res.message || '获取文档详情失败'));
      setIsDraft(false);
      setIsRepositoryMismatch(false);
      return null;
    } catch (err) {
      const requestError = err as AxiosError<{ message?: string }>;

      if (requestError.response?.status === 404) {
        const draftDoc = createDraftDoc(docsId, repositoryId, draftTitleRef.current);

        setData(draftDoc);
        setError(null);
        setIsDraft(true);
        setIsRepositoryMismatch(false);
        return draftDoc;
      }

      setData(null);
      setError(err);
      setIsDraft(false);
      setIsRepositoryMismatch(false);
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
    isRepositoryMismatch,
    getDocsDetail,
  };
}
