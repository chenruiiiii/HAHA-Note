import './load-env';
import pg from 'pg';

interface ConnectionTarget {
  label: string;
  value: string;
}

function readTargets(): ConnectionTarget[] {
  const targets: ConnectionTarget[] = [];
  const runtimeUrl = process.env.DATABASE_URL?.trim();
  const migrationUrl = process.env.MIGRATION_DATABASE_URL?.trim();

  if (runtimeUrl) {
    targets.push({ label: 'DATABASE_URL (runtime)', value: runtimeUrl });
  }

  if (migrationUrl && migrationUrl !== runtimeUrl) {
    targets.push({ label: 'MIGRATION_DATABASE_URL (direct)', value: migrationUrl });
  }

  return targets;
}

function describeTarget(value: string) {
  const url = new URL(value);

  return {
    host: url.hostname,
    port: url.port || '5432',
    database: url.pathname.replace(/^\//, '') || '<default>',
    pooled: url.hostname.includes('-pooler.'),
  };
}

function formatError(error: unknown) {
  if (!(error instanceof Error)) {
    return String(error);
  }

  const code = 'code' in error ? String(error.code) : '';
  const messages: Record<string, string> = {
    ECONNREFUSED: '目标端口拒绝连接，请确认 PostgreSQL 正在运行且地址、端口正确',
    ENOTFOUND: '无法解析数据库主机名，请检查 Neon 连接串是否完整',
    ETIMEDOUT: '连接超时，请检查网络、Neon 项目状态或数据库 IP 限制',
    '28P01': '用户名或密码错误，请重新复制 Neon 连接串',
    '3D000': '数据库不存在，请检查连接串中的数据库名',
    '42P01': '目标表不存在，请先执行 pnpm db:deploy',
  };

  return `${code ? `[${code}] ` : ''}${messages[code] ?? (error.message || error.name)}`;
}

async function checkTarget(target: ConnectionTarget) {
  const details = describeTarget(target.value);
  const client = new pg.Client({
    connectionString: target.value,
    connectionTimeoutMillis: 10_000,
  });

  console.log(`\n[${target.label}]`);
  console.log(
    `host=${details.host} port=${details.port} database=${details.database} pooled=${details.pooled}`
  );

  try {
    await client.connect();
    const version = await client.query<{ version: string }>('select version() as version');
    const tables = await client.query<{ count: string }>(`
      select count(*)::text as count
      from information_schema.tables
      where table_schema = 'public'
    `);
    const migration = await client.query<{ exists: boolean }>(`
      select to_regclass('public._prisma_migrations') is not null as exists
    `);

    console.log(`status=ok server=${version.rows[0]?.version.split(',')[0] ?? 'unknown'}`);
    console.log(
      `public_tables=${tables.rows[0]?.count ?? '0'} prisma_migrations=${migration.rows[0]?.exists ?? false}`
    );

    return true;
  } catch (error) {
    console.error(`status=failed ${formatError(error)}`);
    return false;
  } finally {
    await client.end().catch(() => undefined);
  }
}

async function main() {
  const targets = readTargets();

  if (targets.length === 0) {
    throw new Error('缺少 DATABASE_URL 或 MIGRATION_DATABASE_URL');
  }

  if (process.env.DATA_BACKEND !== 'prisma') {
    throw new Error('当前 DATA_BACKEND 不是 prisma，请先确认 .env.local / Vercel 环境变量');
  }

  const results = await Promise.all(targets.map((target) => checkTarget(target)));

  if (results.some((ok) => !ok)) {
    process.exitCode = 1;
    return;
  }

  console.log('\nDatabase connection check passed.');
}

main().catch((error) => {
  console.error(`Database connection check failed: ${formatError(error)}`);
  process.exit(1);
});
