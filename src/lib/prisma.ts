import 'server-only';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@/generated/prisma/client';

const globalForPrisma = globalThis as unknown as {
  hahaPrisma?: PrismaClient;
};

export function getPrisma(): PrismaClient {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error('DATABASE_URL is required when DATA_BACKEND=prisma');
  }

  if (!globalForPrisma.hahaPrisma) {
    const adapter = new PrismaPg({ connectionString });
    globalForPrisma.hahaPrisma = new PrismaClient({ adapter });
  }

  return globalForPrisma.hahaPrisma;
}

export type { PrismaClient };
