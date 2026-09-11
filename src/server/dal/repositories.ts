import 'server-only';
import { getPrisma } from '@/lib/prisma';
import type { Document, Repository, User } from '@/generated/prisma/client';
import { RepositoryRole, Visibility } from '@/generated/prisma/client';
import { toLegacyDateTime } from './dto';
import { getAccessibleRepository, repositoryAccessWhere } from './access';
import { NotFoundError } from './errors';

export type RepoListItem = {
  docs_id: string;
  docs_name: string;
};

export type RepoDetailRecord = {
  _id: string;
  isPublic: boolean;
  description: string;
  update_time: string;
  creator: string;
  avatar: string[];
  docs_list: RepoListItem[];
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

function toRepoDetailRecord(repo: RepoWithRelations, isCollect = false): RepoDetailRecord {
  return {
    _id: repo.id,
    isPublic: repo.visibility === Visibility.PUBLIC,
    description: repo.description,
    update_time: toLegacyDateTime(repo.updatedAt),
    creator: repo.owner?.nickname ?? '',
    avatar: repo.owner?.avatarUrl ? [repo.owner.avatarUrl] : [],
    docs_list: (repo.documents ?? []).map((doc) => ({
      docs_id: doc.id,
      docs_name: doc.title,
    })),
    title: repo.title,
    repo_desc: repo.description,
    type: repo.type,
    isCollect,
  };
}

const repoInclude = (viewerId?: string) => ({
  owner: { select: { nickname: true, avatarUrl: true } },
  documents: {
    where: { deletedAt: null },
    orderBy: { updatedAt: 'desc' as const },
    select: { id: true, title: true },
  },
  favorites: viewerId ? { where: { userId: viewerId } } : (false as const),
});

export async function listRepositories(viewerId: string): Promise<RepoDetailRecord[]> {
  const prisma = getPrisma();
  const repos = await prisma.repository.findMany({
    where: repositoryAccessWhere(viewerId),
    orderBy: { updatedAt: 'desc' },
    include: repoInclude(viewerId),
  });

  return repos.map((repo) => toRepoDetailRecord(repo, repo.favorites.length > 0));
}

export async function findRepositoryById(
  id: string,
  viewerId: string
): Promise<RepoDetailRecord | null> {
  const prisma = getPrisma();
  const repo = await prisma.repository.findFirst({
    where: { id, ...repositoryAccessWhere(viewerId) },
    include: repoInclude(viewerId),
  });

  if (!repo) {
    return null;
  }

  return toRepoDetailRecord(repo, repo.favorites.length > 0);
}

export async function createRepository(
  payload: { title: string; description?: string; type?: string },
  ownerId: string
): Promise<RepoDetailRecord> {
  const prisma = getPrisma();
  const repo = await prisma.repository.create({
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

  return toRepoDetailRecord(repo, false);
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

export async function ensureRepositoryHasDocument(
  repositoryId: string,
  documentId: string,
  userId: string
): Promise<boolean> {
  await getAccessibleRepository(repositoryId, userId);
  const prisma = getPrisma();
  const doc = await prisma.document.findFirst({
    where: { id: documentId, repositoryId, deletedAt: null },
    select: { id: true },
  });
  return !!doc;
}

export async function requireOwnedRepository(id: string, userId: string) {
  const repo = await findRepositoryById(id, userId);
  if (!repo) {
    throw new NotFoundError('未找到对应的知识库');
  }
  return repo;
}
