import { z } from 'zod';

export const ListItemSchema = z.object({
  _id: z.string(),
  title: z.string(),
  docs_id: z.string(),
});

export const AiChatListItemSchema = z.object({
  docs_id: z.string(),
  title: z.string(),
});

export const AiMissionTextPartSchema = z.object({
  type: z.literal('text'),
  text: z.string(),
});

export const AiMissionMarkdownPartSchema = z.object({
  type: z.literal('markdown'),
  markdown: z.string(),
});

export const AiMissionImageUrlPartSchema = z.object({
  type: z.literal('image_url'),
  image_url: z.object({
    url: z.string(),
    alt: z.string().optional(),
    width: z.number().optional(),
    height: z.number().optional(),
  }),
});

export const AiMissionPartSchema = z.discriminatedUnion('type', [
  AiMissionTextPartSchema,
  AiMissionMarkdownPartSchema,
  AiMissionImageUrlPartSchema,
]);

export const AiMissionMessageSchema = z.object({
  id: z.string(),
  role: z.enum(['system', 'user', 'assistant']),
  parts: z.array(AiMissionPartSchema),
});

export const AiMissionDetailSchema = z.object({
  _id: z.string(),
  title: z.string(),
  category: z.enum(['recent', 'favorite']),
  types: z.array(AiMissionMessageSchema),
  created_at: z.string(),
  updated_at: z.string(),
});

export type ListItem = z.infer<typeof ListItemSchema>;
export type AiChatListItem = z.infer<typeof AiChatListItemSchema>;
export type AiMissionPart = z.infer<typeof AiMissionPartSchema>;
export type AiMissionMessage = z.infer<typeof AiMissionMessageSchema>;
export type AiMissionDetail = z.infer<typeof AiMissionDetailSchema>;
