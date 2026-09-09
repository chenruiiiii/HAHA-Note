import 'server-only';
import { getPrisma } from '@/lib/prisma';
import { UserRole } from '@/generated/prisma/client';

export interface PrismaUserRecord {
  id: string;
  username: string;
  nickname: string;
  role: UserRole;
  passwordHash: string;
  enabled: boolean;
}

export async function findUserByUsername(username: string): Promise<PrismaUserRecord | null> {
  const prisma = getPrisma();
  const user = await prisma.user.findUnique({
    where: { username },
    select: {
      id: true,
      username: true,
      nickname: true,
      role: true,
      passwordHash: true,
      enabled: true,
    },
  });

  return user as PrismaUserRecord | null;
}

export async function findUserById(id: string): Promise<PrismaUserRecord | null> {
  const prisma = getPrisma();
  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      username: true,
      nickname: true,
      role: true,
      passwordHash: true,
      enabled: true,
    },
  });

  return user as PrismaUserRecord | null;
}

export async function createUser(payload: {
  username: string;
  passwordHash: string;
  nickname: string;
  role?: UserRole;
  enabled?: boolean;
}): Promise<PrismaUserRecord> {
  const prisma = getPrisma();
  const user = await prisma.user.create({
    data: {
      username: payload.username,
      passwordHash: payload.passwordHash,
      nickname: payload.nickname,
      role: payload.role ?? UserRole.USER,
      enabled: payload.enabled ?? true,
    },
    select: {
      id: true,
      username: true,
      nickname: true,
      role: true,
      passwordHash: true,
      enabled: true,
    },
  });

  return user as PrismaUserRecord;
}

export async function upsertAdminUser(payload: {
  username: string;
  passwordHash: string;
  nickname: string;
}): Promise<PrismaUserRecord> {
  const prisma = getPrisma();
  const user = await prisma.user.upsert({
    where: { username: payload.username },
    update: {
      passwordHash: payload.passwordHash,
      nickname: payload.nickname,
      role: UserRole.ADMIN,
      enabled: true,
    },
    create: {
      username: payload.username,
      passwordHash: payload.passwordHash,
      nickname: payload.nickname,
      role: UserRole.ADMIN,
      enabled: true,
    },
    select: {
      id: true,
      username: true,
      nickname: true,
      role: true,
      passwordHash: true,
      enabled: true,
    },
  });

  return user as PrismaUserRecord;
}
