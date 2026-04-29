import { z } from 'zod';

export const AdminUserSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
  role: z.string().default('editor'),
  nickname: z.string().min(1),
  enabled: z.boolean().default(true),
  created_at: z.string(),
  updated_at: z.string(),
});

export const LoginPayloadSchema = z.object({
  username: z.string().trim().min(1, '账号不能为空'),
  password: z.string().trim().min(1, '密码不能为空'),
});

export type AdminUser = z.infer<typeof AdminUserSchema>;
export type LoginPayload = z.infer<typeof LoginPayloadSchema>;
