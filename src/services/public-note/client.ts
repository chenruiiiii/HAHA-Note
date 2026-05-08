import http from '@/lib/http';
import { PublicNoteDetail } from '@/types/public-note';
import { ResponseData } from '@/types/response';

export async function getPublicNoteDetail(id: string) {
  return await http.get<ResponseData<PublicNoteDetail>>(`/public-note/${id}`);
}
