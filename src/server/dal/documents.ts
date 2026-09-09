import 'server-only';
import { getPrisma } from '@/lib/prisma';
import type { Document } from '@/generated/prisma/client';
import { DocumentStatus } from '@/generated/prisma/client';

export interface DocumentDetailRecord {
  _id: string;
  repository_id: string;
  title: string;
  content_html: string;
  summary: string;
  author: string;
  updated_at: string;
}

function formatDateTime(date: Date): string {
  const d = new Date(date);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function toDocumentDetailRecord(doc: Document & { creator?: { nickname: string } | null }): DocumentDetailRecord {
  return {
    _id: doc.id,
    repository_id: doc.repositoryId,
    title: doc.title,
    content_html: doc.contentHtml ?? '',
    summary: doc.summary,
    author: doc.creator?.nickname ?? '',
    updated_at: formatDateTime(doc.updatedAt),
  };
}

export async function findDocumentById(id: string): Promise<DocumentDetailRecord | null> {
  const prisma = getPrisma();
  const doc = await prisma.document.findUnique({
    where: { id, deletedAt: null },
    include: { creator: { select: { nickname: true } } },
  });

  if (!doc) {
    return null;
  }

  return toDocumentDetailRecord(doc);
}

export async function updateDocument(
  id: string,
  payload: {
    title?: string;
    content_html?: string;
    summary?: string;
    status?: DocumentStatus;
  }
): Promise<DocumentDetailRecord | null> {
  const prisma = getPrisma();

  const existing = await prisma.document.findUnique({
    where: { id, deletedAt: null },
    include: { creator: { select: { nickname: true } } },
  });

  if (!existing) {
    return null;
  }

  const data: Parameters<typeof prisma.document.update>[0]['data'] = {
    version: { increment: 1 },
  };

  if (payload.title !== undefined) data.title = payload.title;
  if (payload.content_html !== undefined) data.contentHtml = payload.content_html;
  if (payload.summary !== undefined) data.summary = payload.summary;
  if (payload.status !== undefined) data.status = payload.status;

  const doc = await prisma.document.update({
    where: { id },
    data,
    include: { creator: { select: { nickname: true } } },
  });

  return toDocumentDetailRecord(doc);
}

export async function createDocument(payload: {
  repositoryId: string;
  creatorId: string;
  title?: string;
  contentHtml?: string;
  summary?: string;
}): Promise<DocumentDetailRecord> {
  const prisma = getPrisma();
  const doc = await prisma.document.create({
    data: {
      repositoryId: payload.repositoryId,
      creatorId: payload.creatorId,
      title: payload.title ?? '新建文档',
      contentHtml: payload.contentHtml ?? '',
      summary: payload.summary ?? '',
      status: DocumentStatus.DRAFT,
    },
    include: { creator: { select: { nickname: true } } },
  });

  return toDocumentDetailRecord(doc);
}
