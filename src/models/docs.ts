import { z } from 'zod';
import { RepoDetailType } from '@/components/layout/Repository/types';

const RepoListItemSchema = z.object({
  docs_id: z.string(),
  docs_name: z.string(),
});

export const RepositorySchema: z.ZodType<RepoDetailType> = z.object({
  _id: z.string(),
  isPublic: z.boolean(),
  description: z.string(),
  update_time: z.string(),
  creator: z.string(),
  avatar: z.array(z.string()),
  docs_list: z.array(RepoListItemSchema),
  title: z.string(),
  repo_desc: z.string(),
  type: z.string(),
  isCollect: z.boolean(),
});

export const DocumentDetailSchema = z.object({
  _id: z.string(),
  repository_id: z.string(),
  title: z.string(),
  content_html: z.string(),
  author: z.string(),
  updated_at: z.string(),
});

export type Repository = z.infer<typeof RepositorySchema>;
export type DocumentDetail = z.infer<typeof DocumentDetailSchema>;
