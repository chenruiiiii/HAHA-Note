import 'server-only';
import { getPrisma } from '@/lib/prisma';
import type { Repository, Document, User, Prisma } from '@/generated/prisma/client';
import { Visibility } from '@/generated/prisma/client';

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

function formatDateTime(date: Date): string {
  const d = new Date(date);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function toRepoDetailRecord(
  repo: Repository & { owner?: Pick<User, 'nickname' | 'avatarUrl'>; documents?: Pick<Document, 'id' | 'title'>[] },
  isCollect = false
): RepoDetailRecord {
  return {
    _id: repo.id,
    isPublic: repo.visibility === Visibility.PUBLIC,
    description: repo.description,
    update_time: formatDateTime(repo.updatedAt),
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

export async function listRepositories(viewerId?: string): Promise<RepoDetailRecord[]> {
  const prisma = getPrisma();
  const repos = await prisma.repository.findMany({
    where: { deletedAt: null },
    orderBy: { updatedAt: 'desc' },
    include: {
      owner: { select: { nickname: true, avatarUrl: true } },
      documents: {
        where: { deletedAt: null },
        orderBy: { updatedAt: 'desc' },
        select: { id: true, title: true },
      },
      favorites: viewerId ? { where: { userId: viewerId } } : false,
    },
  });

  return repos.map((repo) => toRepoDetailRecord(repo, repo.favorites.length > 0));
}

export async function findRepositoryById(
  id: string,
  viewerId?: string
): Promise<RepoDetailRecord | null> {
  const prisma = getPrisma();
  const repo = await prisma.repository.findUnique({
    where: { id, deletedAt: null },
    include: {
      owner: { select: { nickname: true, avatarUrl: true } },
      documents: {
        where: { deletedAt: null },
        orderBy: { updatedAt: 'desc' },
        select: { id: true, title: true },
      },
      favorites: viewerId ? { where: { userId: viewerId } } : false,
    },
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
      visibility: Visibility.PUBLIC,
    },
    include: {
      owner: { select: { nickname: true, avatarUrl: true } },
      documents: { select: { id: true, title: true } },
      favorites: false,
    },
  });

  return toRepoDetailRecord(repo, false);
}

export async function toggleRepositoryFavorite(
  repositoryId: string,
  userId: string,
  isCollect: boolean
): Promise<RepoDetailRecord | null> {
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
  documentId: string
): Promise<boolean> {
  const prisma = getPrisma();
  const doc = await prisma.document.findFirst({
    where: { id: documentId, repositoryId, deletedAt: null },
    select: { id: true },
  });
  return !!doc;
}
