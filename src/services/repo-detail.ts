import { RepoDetailType } from '@/components/layout/Repository/types';
import http from '@/lib/http';
import { ResponseData } from '@/types/response';

export const getRepoDetailData = async (repoId: string) => {
  return await http.get<ResponseData<RepoDetailType>>(`/repo-detail/${repoId}`);
};
