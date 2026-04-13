// src/models/docs.ts
import { z } from 'zod';
import { nanoid } from 'nanoid';

// 知识库 Schema
export const RepositorySchema = z.object({
  _id: z.string(),
  type: z.string(),
  title: z.string(),
  creator: z.string(),
  time: z.string(),
  repository: z.string(),
  docs_list: z.array(
    z.object({
      docs_name: z.string(),
      docs_id: z.string(),
    })
  ),
});

// 文档详情 Schema
export const DocumentDetailSchema = z.object({
  _id: z.string(),
  repository_id: z.string(), // 所属知识库 ID
  title: z.string(),
  content_html: z.string(),
  author: z.string(),
  updated_at: z.string(),
});

export type Repository = z.infer<typeof RepositorySchema>;
export type DocumentDetail = z.infer<typeof DocumentDetailSchema>;
