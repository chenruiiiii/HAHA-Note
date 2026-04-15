export interface LeftRecommendItemType {
  id: string;
  user: {
    avatar?: string;
    username: string;
  };
  content: {
    title: string;
    description: string;
    image?: string;
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

export interface RecommendDetailType {
  _id: string;
  source: {
    platform: 'yuque' | 'community';
    title: string;
    avatar?: string;
  };
  author: {
    name: string;
    avatar?: string;
  };
  title_html: string;
  description_html: string;
  content_html: string;
  quality_level: 'featured' | 'normal';
  like_count: number;
  comment_count: number;
  word_count: number;
  source_url?: string;
}
