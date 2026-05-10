import { RecommendDetailType } from '@/components/layout/Stroll/types/recommend';
import http from '@/lib/http';
import { ResponseData } from '@/types/response';

/**
 * 获取逛逛推荐列表
 */
export const getStrollRecommend = async () => {
  return await http.get<ResponseData<RecommendDetailType[]>>('/stroll/left');
};
