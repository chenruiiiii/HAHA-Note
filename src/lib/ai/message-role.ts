import type { AiMissionMessage } from '@/models/ai-mission';

/**
 * Normalize a persisted message role into the chat UI vocabulary.
 *
 * Prisma stores `MessageRole` values as uppercase enum members, while legacy
 * MongoDB documents use lowercase strings. Unknown values intentionally fall
 * back to `user` to preserve the previous compatibility behavior.
 */
export function normalizeMessageRole(role: unknown): AiMissionMessage['role'] {
  const normalized = String(role ?? '').toLowerCase();

  if (normalized === 'assistant' || normalized === 'system') {
    return normalized;
  }

  return 'user';
}
