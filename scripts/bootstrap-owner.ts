import './load-env';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient, UserRole } from '../src/generated/prisma/client';
import { hashPassword } from '../src/lib/auth/password';

const ownerId = process.env.BOOTSTRAP_OWNER_ID?.trim() || 'usr_legacy_owner';
const username = process.env.BOOTSTRAP_OWNER_USERNAME?.trim() || 'migration_owner';
const password = process.env.BOOTSTRAP_OWNER_PASSWORD?.trim();

const pgUrl = process.env.MIGRATION_DATABASE_URL || process.env.DATABASE_URL;
if (!pgUrl) {
  throw new Error('缺少 MIGRATION_DATABASE_URL / DATABASE_URL');
}

const adapter = new PrismaPg({ connectionString: pgUrl });
const prisma = new PrismaClient({ adapter });

async function main() {
  if (!password) {
    throw new Error('缺少 BOOTSTRAP_OWNER_PASSWORD');
  }

  const passwordHash = await hashPassword(password);
  const user = await prisma.user.upsert({
    where: { id: ownerId },
    update: {
      username,
      passwordHash,
      nickname: 'Migration Owner',
      role: UserRole.ADMIN,
      enabled: true,
      passwordResetRequired: false,
    },
    create: {
      id: ownerId,
      username,
      passwordHash,
      nickname: 'Migration Owner',
      role: UserRole.ADMIN,
      enabled: true,
      passwordResetRequired: false,
    },
  });

  console.log(JSON.stringify({ id: user.id, username: user.username, enabled: user.enabled }));
}

main()
  .catch((error) => {
    console.error('✗ 创建迁移所有者失败：', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect().catch(() => undefined);
  });
