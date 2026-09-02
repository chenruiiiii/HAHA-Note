import 'server-only';
import { verifyPassword } from '@/lib/auth/password';
import { getPrisma } from '@/lib/prisma';
import {
  createAuthSession,
  revokeAuthSession,
  rotateAuthSession,
  type AuthSessionUser,
} from './session-service';

export type AuthUser = AuthSessionUser;

function toAuthUser(user: {
  id: string;
  username: string;
  role: unknown;
  nickname: string;
}): AuthUser {
  return {
    userId: user.id,
    username: user.username,
    role: String(user.role),
    nickname: user.nickname,
  };
}

export async function loginWithPrisma(
  username: string,
  password: string,
  userAgent?: string | null,
  ipHash?: string | null
) {
  const prisma = getPrisma();
  const user = await prisma.user.findUnique({ where: { username } });

  if (!user || !user.enabled) {
    return null;
  }

  const passwordValid = await verifyPassword(password, user.passwordHash);
  if (!passwordValid) {
    return null;
  }

  const session = await createAuthSession(user.id, userAgent, ipHash);

  return {
    user: toAuthUser(user),
    refreshToken: session.refreshToken,
  };
}

export async function refreshWithPrisma(
  refreshToken: string,
  userAgent?: string | null,
  ipHash?: string | null
) {
  return rotateAuthSession(refreshToken, userAgent, ipHash);
}

export async function logoutWithPrisma(refreshToken: string): Promise<void> {
  await revokeAuthSession(refreshToken);
}
