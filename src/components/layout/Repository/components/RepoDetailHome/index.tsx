'use client';

import HAEmpty from '@/components/common/HAEmpty';
import { useAppDispatch, useAppSelector } from '@/store';
import { useParams } from 'next/navigation';
import RepoDetailHomeView from './view';
import HALoading from '@/components/common/HALoading';
import { useCallback, useEffect, useState } from 'react';
import {
  syncRepoDetailCollectAction,
  toggleRepoDetailCollectOptimisticAction,
  upsertRepoDetailDocAction,
} from '@/store/modules/repoDetail';
import { useRouter } from 'next/navigation';
import { createDocsDetailData } from '@/services/docs-detail';
import { nanoid } from 'nanoid';
import { message } from 'antd';

const RepoDetailHome = () => {
  const params = useParams();
  const router = useRouter();
  const repoId = params.repoId as string | undefined;
  const dispatch = useAppDispatch();
  const [messageApi, contextHolder] = message.useMessage();
  const [isCreatingDocument, setIsCreatingDocument] = useState(false);
  const repoDetail = useAppSelector((state) =>
    repoId ? state.repoDetail.cacheById[repoId]?.data : null
  );
  const isCollectDirty = useAppSelector((state) =>
    repoId ? Boolean(state.repoDetail.dirtyCollectById[repoId]) : false
  );

  const handleToggleCollect = useCallback(() => {
    if (!repoId) return;
    dispatch(toggleRepoDetailCollectOptimisticAction(repoId));
  }, [dispatch, repoId]);

  const handleCreateDocument = useCallback(async () => {
    if (!repoId || isCreatingDocument) return;

    const docsId = nanoid();
    try {
      setIsCreatingDocument(true);
      const response = await createDocsDetailData(docsId, repoId);

      if (response.code !== 200) {
        throw new Error(response.message || '新建文档失败');
      }

      dispatch(
        upsertRepoDetailDocAction({
          repoId,
          docsId,
          docsName: response.data.title || '新建文档',
        })
      );
      router.push(`/repo-detail/${repoId}/${docsId}`);
    } catch (createError) {
      messageApi.error(
        createError instanceof Error ? createError.message : '新建文档失败'
      );
    } finally {
      setIsCreatingDocument(false);
    }
  }, [dispatch, isCreatingDocument, messageApi, repoId, router]);

  useEffect(() => {
    if (!repoId) return;

    return () => {
      if (!isCollectDirty) return;
      void dispatch(syncRepoDetailCollectAction({ id: repoId, keepalive: true }));
    };
  }, [dispatch, isCollectDirty, repoId]);

  if (!repoId) return <HAEmpty />;
  if (!repoDetail) return <HALoading type="simple" />;

  return (
    <>
      {contextHolder}
      <RepoDetailHomeView
        repoDetail={repoDetail}
        isCreatingDocument={isCreatingDocument}
        onCreateDocument={handleCreateDocument}
        onToggleCollect={handleToggleCollect}
      />
    </>
  );
};

export default RepoDetailHome;
