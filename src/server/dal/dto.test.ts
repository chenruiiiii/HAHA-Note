import { describe, it, expect } from 'vitest';
import { serializeBigInt, toIsoDateTime, toLegacyDateTime } from '@/server/dal/dto';

describe('dto serialization', () => {
  it('serializes BigInt as decimal string', () => {
    const input = { sizeBytes: BigInt('1024'), nested: { v: BigInt('-5') } };
    const out = serializeBigInt(input);
    expect(out.sizeBytes).toBe('1024');
    expect(out.nested.v).toBe('-5');
  });

  it('passes through plain JSON values unchanged', () => {
    const input = { a: [1, 2], b: 'x', c: null };
    expect(serializeBigInt(input)).toEqual(input);
  });

  it('formats ISO datetime and tolerates invalid input', () => {
    expect(toIsoDateTime(new Date('2026-04-16T10:18:00Z'))).toBe('2026-04-16T10:18:00.000Z');
    expect(toIsoDateTime(null)).toBe('');
    expect(toIsoDateTime('not-a-date')).toBe('');
  });

  it('formats legacy datetime as YYYY-MM-DD HH:mm', () => {
    const date = new Date('2026-04-16T10:18:00Z');
    expect(toLegacyDateTime(date)).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/);
    expect(toLegacyDateTime(null)).not.toBe('');
  });
});
