import http from '@/lib/http';
import { ResponseData } from '@/types/response';

export interface LoginRequestPayload {
  username: string;
  password: string;
}

export interface LoginResponseData {
  username: string;
  role: string;
  nickname: string;
}

export async function postLogin(payload: LoginRequestPayload) {
  return await http.post<ResponseData<LoginResponseData>>('/api/login', payload);
}
