import http from '@/lib/http';
import { ResponseData } from '@/types/response';
import { DocumentDetail } from '@/models/docs';

export const getDocsDetailData = async (docsId: string) => {
  return await http.get<ResponseData<DocumentDetail>>(`/docs-detail/${docsId}`);
};

export const createDocsDetailData = async (
  docsId: string,
  repositoryId: string,
  title = '新建文档'
) => {
  return await http.post<ResponseData<DocumentDetail>>(`/docs-detail/${docsId}`, {
    title,
    content_html: '',
    repository_id: repositoryId,
  });
};

export const updateDocsDetailData = async (
  docsId: string,
  payload: Pick<DocumentDetail, 'title' | 'content_html'> &
    Partial<Pick<DocumentDetail, 'repository_id' | 'author' | 'summary'>>
) => {
  return await http.post<ResponseData<DocumentDetail>>(`/docs-detail/${docsId}`, payload);
};
