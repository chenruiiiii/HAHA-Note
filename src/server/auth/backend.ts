import 'server-only';

export function isPrismaBackend(): boolean {
  return process.env.DATA_BACKEND === 'prisma';
}
