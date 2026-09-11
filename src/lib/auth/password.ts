import bcrypt from 'bcryptjs';

const BCRYPT_ROUNDS = 12;

function peppered(password: string): string {
  return `${process.env.PASSWORD_PEPPER ?? ''}${password}`;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(peppered(password), BCRYPT_ROUNDS);
}

export async function verifyPassword(password: string, passwordHash: string): Promise<boolean> {
  return bcrypt.compare(peppered(password), passwordHash);
}
