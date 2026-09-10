import 'server-only';
import {
  ActivityType,
  DocumentStatus,
  type Prisma,
} from '@/generated/prisma/client';
import { getPrisma } from '@/lib/prisma';
import { getAccessibleRepository } from './access';
import { toIsoDateTime } from './dto';
import { ConflictError, NotFoundError } from './errors';

const EMPTY_CONTENT: Prisma.InputJsonObject = {
  type: 'doc',
  content: [],
};

export interface DocumentDetailRecord {
  _id: string;
  repository_id: string;
  title: string;
  content_html: string;
  summary: string;
  author: string;
  updated_at: string;
}

function toDocumentDetailRecord(document: {
  id: string;
  repositoryId: string;
  title: string;
  contentHtml: string | null;
  summary: string;
  updatedAt: Date;
  creator?: { nickname: string } | null;
}): DocumentDetailRecord {
  return {
    _id: document.id,
    repository_id: document.repositoryId,
    title: document.title,
    content_html: document.contentHtml ?? '',
    summary: document.summary,
    author: document.creator?.nickname ?? '',
    updated_at: toIsoDateTime(document.updatedAt),
  };
}

async function loadDocumentForUser(id: string, userId: string) {
  const prisma = getPrisma();
  return prisma.document.findFirst({
    where: {
      id,
      deletedAt: null,
      repository: {
        deletedAt: null,
        OR: [{ ownerId: userId }, { members: { some: { userId } } }],
      },
    },
    include: { creator: { select: { nickname: true } } },
  });
}

export async function findDocumentById(
  id: string,
  userId: string
): Promise<DocumentDetailRecord | null> {
  const document = await loadDocumentForUser(id, userId);
  return document ? toDocumentDetailRecord(document) : null;
}

export async function createDocument(payload: {
  id: string;
  repositoryId: string;
  creatorId: string;
  title?: string;
  contentHtml?: string;
  summary?: string;
}): Promise<DocumentDetailRecord> {
  await getAccessibleRepository(payload.repositoryId, payload.creatorId);
  const prisma = getPrisma();

  const document = await prisma.$transaction(async (tx) => {
    const created = await tx.document.create({
      data: {
        id: payload.id,
        repositoryId: payload.repositoryId,
        creatorId: payload.creatorId,
        title: payload.title?.trim() || '新建文档',
        content: EMPTY_CONTENT,
        contentHtml: payload.contentHtml ?? '',
        contentText: '',
        summary: payload.summary?.trim() || '',
        status: DocumentStatus.DRAFT,
      },
      include: { creator: { select: { nickname: true } } },
    });

    await tx.activity.create({
      data: {
        userId: payload.creatorId,
        documentId: created.id,
        type: ActivityType.DOCUMENT_CREATED,
      },
    });

    return created;
  });

  return toDocumentDetailRecord(document);
}

export async function updateDocument(
  id: string,
  userId: string,
  payload: {
    title?: string;
    content_html?: string;
    summary?: string;
  }
): Promise<DocumentDetailRecord> {
  const existing = await loadDocumentForUser(id, userId);

  if (!existing) {
    throw new NotFoundError('未找到对应文档');
  }

  const prisma = getPrisma();
  const document = await prisma.document.update({
    where: { id },
    data: {
      title: payload.title?.trim() || existing.title,
      contentHtml: payload.content_html ?? existing.contentHtml,
      summary: payload.summary ?? existing.summary,
      version: { increment: 1 },
    },
    include: { creator: { select: { nickname: true } } },
  });

  return toDocumentDetailRecord(document);
}

export async function upsertDocumentForUser(
  id: string,
  userId: string,
  payload: {
    title?: string;
    content_html?: string;
    summary?: string;
    repository_id?: string;
  }
): Promise<DocumentDetailRecord> {
  const existing = await loadDocumentForUser(id, userId);

  if (!existing) {
    const repositoryId = payload.repository_id?.trim();
    if (!repositoryId) {
      throw new NotFoundError('新建文档时 repository_id 不能为空');
    }

    return createDocument({
      id,
      repositoryId,
      creatorId: userId,
      title: payload.title,
      contentHtml: payload.content_html,
      summary: payload.summary,
    });
  }

  if (payload.repository_id && payload.repository_id !== existing.repositoryId) {
    throw new ConflictError('文档所属知识库不匹配，请刷新目录后重试');
  }

  return updateDocument(id, userId, payload);
}
