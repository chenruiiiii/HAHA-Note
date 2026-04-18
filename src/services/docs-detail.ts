import http from '@/lib/http';
import { ResponseData } from '@/types/response';
import { DocumentDetail } from '@/models/docs';

export const getDocsDetailData = async (docsId: string) => {
  return await http.get<ResponseData<DocumentDetail>>(`/docs-detail/${docsId}`);
};

export const updateDocsDetailData = async (
  docsId: string,
  payload: Pick<DocumentDetail, 'title' | 'content_html'>
) => {
  return await http.post<ResponseData<DocumentDetail>>(`/docs-detail/${docsId}`, payload);
};
