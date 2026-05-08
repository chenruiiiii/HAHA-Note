import http from '@/lib/http';
import { DocumentDetail } from '@/models/docs';
import { ResponseData } from '@/types/response';

interface DocsSummaryPayload {
  title: string;
  content_html: string;
  repository_id?: string;
  author?: string;
  persist?: boolean;
}

interface DocsSummaryResult {
  summary: string;
}

export async function generateDocsSummary(docsId: string, payload: DocsSummaryPayload) {
  return await http.post<ResponseData<DocsSummaryResult | DocumentDetail>>(
    `/docs-summary/${docsId}`,
    payload
  );
}
