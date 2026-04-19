import http from '@/lib/http';
import type { ListItem } from '@/models/ai-mission';
import type { ResponseData } from '@/types/response';

export const getLatestMissionList = async () => {
  return await http.get<ResponseData<ListItem[]>>('/chat-latest-mission');
};

export const getCollectMissionList = async () => {
  return await http.get<ResponseData<ListItem[]>>('/chat-collect-mission');
};
