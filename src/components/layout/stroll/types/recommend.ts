export interface LeftRecommendItemType {
  id: string;
  user: {
    avatar?: string;
    username: string;
  };
  content: {
    title: string;
    description: string;
    image?: string; // 图片可选
  };
  likNum: number;
  detail_url: string;
}

export interface RightRecommendItemType {
  id: string;
  user: {
    avatar?: string;
    username: string;
    signature?: string;
  };
  recommend_title: string;
}
