import { z } from 'zod';

import type {
  LeftRecommendItemType,
  RecommendDetailType,
  RightRecommendItemType,
} from '@/components/layout/Stroll/types/recommend';

const recommendUserSchema = z.object({
  avatar: z.string().optional(),
  username: z.string(),
});

const leftRecommendContentSchema = z.object({
  title: z.string(),
  description: z.string(),
  image: z.string().optional(),
});

const rightRecommendUserSchema = recommendUserSchema.extend({
  signature: z.string().optional(),
});

const recommendSourceSchema = z.object({
  platform: z.enum(['yuque', 'community']),
  title: z.string(),
  avatar: z.string().optional(),
});

const recommendAuthorSchema = z.object({
  name: z.string(),
  avatar: z.string().optional(),
});

export const leftRecommendItemModelSchema: z.ZodType<LeftRecommendItemType> = z.object({
  id: z.string(),
  user: recommendUserSchema,
  content: leftRecommendContentSchema,
  likNum: z.number(),
  detail_url: z.string(),
});

export const rightRecommendItemModelSchema: z.ZodType<RightRecommendItemType> = z.object({
  id: z.string(),
  user: rightRecommendUserSchema,
  recommend_title: z.string(),
});

export const recommendDetailModelSchema: z.ZodType<RecommendDetailType> = z.object({
  _id: z.string(),
  source: recommendSourceSchema,
  author: recommendAuthorSchema,
  title_html: z.string(),
  description_html: z.string(),
  content_html: z.string(),
  quality_level: z.enum(['featured', 'normal']),
  like_count: z.number(),
  comment_count: z.number(),
  word_count: z.number(),
  source_url: z.string(),
});

export const leftRecommendListModelSchema = z.array(leftRecommendItemModelSchema);
export const rightRecommendListModelSchema = z.array(rightRecommendItemModelSchema);
export const recommendDetailListModelSchema = z.array(recommendDetailModelSchema);
