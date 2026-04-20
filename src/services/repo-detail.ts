import { RepoDetailApiType, RepoDetailType } from '@/components/layout/Repository/types';
import http from '@/lib/http';
import { ResponseData } from '@/types/response';

export const getRepoDetailData = async (repoId: string) => {
  return await http.get<ResponseData<RepoDetailApiType>>(`/repo-detail/${repoId}`);
};

export const normalizeRepoDetailData = (repoDetail: RepoDetailApiType): RepoDetailType => {
  return {
    _id: repoDetail._id,
    isPublic: repoDetail.isPublic ?? false,
    description: repoDetail.description ?? '',
    update_time: repoDetail.update_time ?? '',
    creator: repoDetail.creator ?? '',
    avatar: Array.isArray(repoDetail.avatar) ? repoDetail.avatar : [],
    docs_list: Array.isArray(repoDetail.docs_list) ? repoDetail.docs_list : [],
    title: repoDetail.title ?? '',
    repo_desc: repoDetail.repo_desc ?? '',
    type: repoDetail.type ?? '',
    isCollect: repoDetail.isCollect ?? false,
  };
};

export const syncRepoCollectStatus = async (
  repoId: string,
  isCollect: boolean,
  options?: { keepalive?: boolean }
) => {
  return await fetch(`/api/repo-detail/${repoId}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({ isCollect }),
    keepalive: options?.keepalive ?? false,
  }).then((res) => res.json() as Promise<ResponseData<RepoDetailApiType>>);
};
