import { RecommendDetailType } from '@/components/layout/Stroll/types/recommend';
import http from '@/lib/http';
import { ResponseData } from '@/types/response';
import { NextApiResponse } from 'next';

/**
 * 获取逛逛推荐列表
 * @param page 当前页码 (默认 1)
 * @param limit 每页条数 (默认 10)
 */
export const getStrollRecommend = async (page: number = 1, limit: number = 10) => {
  return await http.get<ResponseData<RecommendDetailType[]>>('/stroll/left', {
    params: {
      page,
      limit,
    },
  });
};
