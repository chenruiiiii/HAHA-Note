'use client';

import HAEmpty from '@/components/common/HAEmpty';
import { useAppDispatch, useAppSelector } from '@/store';
import { useParams } from 'next/navigation';
import RepoDetailHomeView from './view';
import HALoading from '@/components/common/HALoading';
import HAError from '@/components/common/HAError';
import { useCallback, useEffect } from 'react';
import {
  syncRepoDetailCollectAction,
  toggleRepoDetailCollectOptimisticAction,
} from '@/store/modules/repoDetail';

const RepoDetailHome = () => {
  const params = useParams();
  const repoId = params.repoId as string | undefined;
  const dispatch = useAppDispatch();
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

  useEffect(() => {
    if (!repoId) return;

    return () => {
      if (!isCollectDirty) return;
      void dispatch(syncRepoDetailCollectAction({ id: repoId, keepalive: true }));
    };
  }, [dispatch, isCollectDirty, repoId]);

  if (!repoId) return <HAEmpty />;
  if (!repoDetail) return <HALoading type="simple" />;
  if (!repoDetail.docs_list) return <HAError />;

  return <RepoDetailHomeView repoDetail={repoDetail} onToggleCollect={handleToggleCollect} />;
};

export default RepoDetailHome;
