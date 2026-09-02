import 'dotenv/config';
import { defineConfig } from 'prisma/config';

const fallbackUrl =
  'postgresql://user:password@localhost:5432/haha_note?sslmode=require';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: 'tsx prisma/seed.ts',
  },
  datasource: {
    url: process.env.MIGRATION_DATABASE_URL || process.env.DATABASE_URL || fallbackUrl,
  },
});
