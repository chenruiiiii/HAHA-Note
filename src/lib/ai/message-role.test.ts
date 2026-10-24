import { describe, expect, it } from 'vitest';
import { normalizeMessageRole } from './message-role';

describe('normalizeMessageRole', () => {
  it('normalizes Prisma uppercase roles', () => {
    expect(normalizeMessageRole('ASSISTANT')).toBe('assistant');
    expect(normalizeMessageRole('SYSTEM')).toBe('system');
    expect(normalizeMessageRole('USER')).toBe('user');
  });

  it('preserves legacy lowercase roles', () => {
    expect(normalizeMessageRole('assistant')).toBe('assistant');
    expect(normalizeMessageRole('system')).toBe('system');
    expect(normalizeMessageRole('user')).toBe('user');
  });

  it('falls back to user for unknown or missing roles', () => {
    expect(normalizeMessageRole('tool')).toBe('user');
    expect(normalizeMessageRole(undefined)).toBe('user');
  });
});
