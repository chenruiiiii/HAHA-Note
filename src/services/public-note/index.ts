import http from '@/lib/http';
import { publicNoteMockMap } from '@/constants/config.ts/mock';
import { PublicNoteDetail } from '@/types/public-note';

interface PublicNoteResponse {
  code: number;
  data: PublicNoteDetail;
  message: string;
}

export async function fetchPublicNoteDetail(id: string) {
  const response = (await http.get<PublicNoteResponse>(
    `/api/public-note/${id}`
  )) as unknown as PublicNoteResponse;

  if (response.code !== 0 || !response.data) {
    throw new Error(response.message || '公开笔记不存在');
  }

  return response.data;
}

export async function getPublicNoteDetailById(id: string) {
  return publicNoteMockMap[id] ?? null;
}
