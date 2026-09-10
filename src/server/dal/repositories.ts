import 'server-only';
import {
  RepositoryRole,
  Visibility,
  type Document,
  type Repository,
  type User,
} from '@/generated/prisma/client';
import { getPrisma } from '@/lib/prisma';
import { getAccessibleRepository, repositoryAccessWhere } from './access';
import { toLegacyDateTime } from './dto';

export type RepoDetailRecord = {
  _id: string;
  isPublic: boolean;
  description: string;
  update_time: string;
  creator: string;
  avatar: string[];
  docs_list: Array<{ docs_id: string; docs_name: string }>;
  title: string;
  repo_desc: string;
  type: string;
  isCollect: boolean;
};

type RepoWithRelations = Repository & {
  owner?: Pick<User, 'nickname' | 'avatarUrl'> | null;
  documents?: Pick<Document, 'id' | 'title'>[];
  favorites?: { userId: string }[];
};

function toRepoDetailRecord(
  repo: RepoWithRelations,
  isCollect = false
): RepoDetailRecord {
  return {
    _id: repo.id,
    isPublic: repo.visibility === Visibility.PUBLIC,
    description: repo.description,
    update_time: toLegacyDateTime(repo.updatedAt),
    creator: repo.owner?.nickname ?? '',
    avatar: repo.owner?.avatarUrl ? [repo.owner.avatarUrl] : [],
    docs_list: (repo.documents ?? []).map((document) => ({
      docs_id: document.id,
      docs_name: document.title,
    })),
    title: repo.title,
    repo_desc: repo.description,
    type: repo.type,
    isCollect,
  };
}

function repoInclude(viewerId: string) {
  return {
    owner: { select: { nickname: true, avatarUrl: true } },
    documents: {
      where: { deletedAt: null },
      orderBy: { updatedAt: 'desc' as const },
      select: { id: true, title: true },
    },
    favorites: { where: { userId: viewerId } },
  };
}

export async function listRepositories(
  viewerId: string
): Promise<RepoDetailRecord[]> {
  const prisma = getPrisma();
  const repositories = await prisma.repository.findMany({
    where: repositoryAccessWhere(viewerId),
    orderBy: { updatedAt: 'desc' },
    include: repoInclude(viewerId),
  });

  return repositories.map((repository) =>
    toRepoDetailRecord(repository, repository.favorites.length > 0)
  );
}

export async function createRepository(
  payload: { title: string; description?: string; type?: string },
  ownerId: string
): Promise<RepoDetailRecord> {
  const prisma = getPrisma();
  const repository = await prisma.repository.create({
    data: {
      ownerId,
      title: payload.title,
      description: payload.description ?? '',
      type: payload.type ?? 'book',
      visibility: Visibility.PRIVATE,
      members: {
        create: {
          userId: ownerId,
          role: RepositoryRole.OWNER,
        },
      },
    },
    include: repoInclude(ownerId),
  });

  return toRepoDetailRecord(repository, false);
}

export async function findRepositoryById(
  id: string,
  viewerId: string
): Promise<RepoDetailRecord | null> {
  const prisma = getPrisma();
  const repository = await prisma.repository.findFirst({
    where: { id, ...repositoryAccessWhere(viewerId) },
    include: repoInclude(viewerId),
  });

  if (!repository) {
    return null;
  }

  return toRepoDetailRecord(repository, repository.favorites.length > 0);
}

export async function toggleRepositoryFavorite(
  repositoryId: string,
  userId: string,
  isCollect: boolean
): Promise<RepoDetailRecord | null> {
  await getAccessibleRepository(repositoryId, userId);
  const prisma = getPrisma();

  await prisma.$transaction(async (tx) => {
    const existing = await tx.repositoryFavorite.findUnique({
      where: { userId_repositoryId: { userId, repositoryId } },
    });

    if (isCollect && !existing) {
      await tx.repositoryFavorite.create({
        data: { userId, repositoryId },
      });
    } else if (!isCollect && existing) {
      await tx.repositoryFavorite.delete({
        where: { userId_repositoryId: { userId, repositoryId } },
      });
    }
  });

  return findRepositoryById(repositoryId, userId);
}
