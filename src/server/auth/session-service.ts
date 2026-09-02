import 'server-only';
import crypto from 'node:crypto';
import { REFRESH_TOKEN_TTL_SECONDS } from '@/constants/auth';
import { getPrisma } from '@/lib/prisma';

export interface AuthSessionUser {
  userId: string;
  username: string;
  role: string;
  nickname: string;
}

function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function createRefreshToken(): string {
  return crypto.randomBytes(48).toString('base64url');
}

function toSessionUser(user: {
  id: string;
  username: string;
  role: unknown;
  nickname: string;
}): AuthSessionUser {
  return {
    userId: user.id,
    username: user.username,
    role: String(user.role),
    nickname: user.nickname,
  };
}

export async function createAuthSession(
  userId: string,
  userAgent?: string | null,
  ipHash?: string | null
) {
  const prisma = getPrisma();
  const refreshToken = createRefreshToken();

  const session = await prisma.session.create({
    data: {
      userId,
      refreshTokenHash: hashToken(refreshToken),
      expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_SECONDS * 1000),
      userAgent: userAgent?.slice(0, 500) ?? null,
      ipHash: ipHash?.slice(0, 64) ?? null,
    },
  });

  return { refreshToken, session };
}

export async function rotateAuthSession(
  refreshToken: string,
  userAgent?: string | null,
  ipHash?: string | null
) {
  const prisma = getPrisma();
  const session = await prisma.session.findUnique({
    where: { refreshTokenHash: hashToken(refreshToken) },
    include: { user: true },
  });

  if (
    !session ||
    session.revokedAt ||
    session.expiresAt <= new Date() ||
    !session.user.enabled
  ) {
    return null;
  }

  const nextRefreshToken = createRefreshToken();
  const updated = await prisma.session.update({
    where: { id: session.id },
    data: {
      refreshTokenHash: hashToken(nextRefreshToken),
      expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_SECONDS * 1000),
      revokedAt: null,
      userAgent: userAgent?.slice(0, 500) ?? session.userAgent,
      ipHash: ipHash?.slice(0, 64) ?? session.ipHash,
    },
  });

  return {
    user: toSessionUser(session.user),
    refreshToken: nextRefreshToken,
    session: updated,
  };
}

export async function revokeAuthSession(refreshToken: string): Promise<void> {
  const prisma = getPrisma();

  await prisma.session.updateMany({
    where: {
      refreshTokenHash: hashToken(refreshToken),
      revokedAt: null,
    },
    data: {
      revokedAt: new Date(),
    },
  });
}
