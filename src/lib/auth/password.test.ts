import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { hashPassword, verifyPassword } from '@/lib/auth/password';

const ORIGINAL_PEPPER = process.env.PASSWORD_PEPPER;

beforeAll(() => {
  process.env.PASSWORD_PEPPER = 'test-pepper';
});

afterAll(() => {
  if (ORIGINAL_PEPPER === undefined) delete process.env.PASSWORD_PEPPER;
  else process.env.PASSWORD_PEPPER = ORIGINAL_PEPPER;
});

describe('password hashing', () => {
  it('hashes a password and verifies it with the correct pepper', async () => {
    const hash = await hashPassword('correct horse');
    expect(hash).not.toContain('correct horse');
    await expect(verifyPassword('correct horse', hash)).resolves.toBe(true);
  });

  it('rejects a wrong password', async () => {
    const hash = await hashPassword('right');
    await expect(verifyPassword('wrong', hash)).resolves.toBe(false);
  });

  it('produces different hashes for the same input (salting)', async () => {
    const a = await hashPassword('same');
    const b = await hashPassword('same');
    expect(a).not.toBe(b);
  });

  it('never stores the plaintext or the pepper', async () => {
    const hash = await hashPassword('secret123');
    expect(hash).not.toMatch(/secret123|test-pepper/);
  });
});
