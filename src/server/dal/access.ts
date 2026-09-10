import 'server-only';
import { getPrisma } from '@/lib/prisma';
import { NotFoundError } from './errors';

export async function getAccessibleRepository(
  repositoryId: string,
  userId: string
) {
  const prisma = getPrisma();
  const repository = await prisma.repository.findFirst({
    where: {
      id: repositoryId,
      ...repositoryAccessWhere(userId),
    },
  });

  if (!repository) {
    throw new NotFoundError('未找到对应的知识库');
  }

  return repository;
}

export function repositoryAccessWhere(userId: string) {
  return {
    deletedAt: null,
    OR: [{ ownerId: userId }, { members: { some: { userId } } }],
  };
}
