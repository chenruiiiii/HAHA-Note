import 'server-only';
import { getPrisma } from '@/lib/prisma';

/** 文档详情 DTO，用于 GET 接口。不暴露内部 creatorId/repositoryId。 */
export interface DocumentDetailDto {
  id: string;
  version: number;
  title: string;
  summary: string;
  contentHtml: string | null;
  contentText: string;
  updatedAt: Date;
}

export type ReadDocumentResult =
  | { ok: true; document: DocumentDetailDto }
  | { ok: false; code: 'NOT_FOUND' | 'FORBIDDEN' };

/**
 * 判断调用者是否有权读取指定文档：文档创建者、所属仓库 owner，或任意仓库成员（含 VIEWER）。
 */
function canRead(
  document: {
    creatorId: string;
    repository: {
      ownerId: string;
      members: Array<{ userId: string }>;
    };
  },
  userId: string
): boolean {
  if (document.creatorId === userId) return true;
  if (document.repository.ownerId === userId) return true;
  return document.repository.members.some((member) => member.userId === userId);
}

/**
 * 读取文档详情。调用者需为文档创建者、仓库 owner 或任意成员，否则返回 FORBIDDEN。
 */
export async function getDocument(
  documentId: string,
  userId: string
): Promise<ReadDocumentResult> {
  const prisma = getPrisma();

  const existing = await prisma.document.findUnique({
    where: { id: documentId },
    select: {
      id: true,
      creatorId: true,
      deletedAt: true,
      version: true,
      title: true,
      summary: true,
      contentHtml: true,
      contentText: true,
      updatedAt: true,
      repository: {
        select: {
          ownerId: true,
          members: {
            select: { userId: true },
          },
        },
      },
    },
  });

  if (!existing || existing.deletedAt) {
    return { ok: false, code: 'NOT_FOUND' };
  }

  if (!canRead(existing, userId)) {
    return { ok: false, code: 'FORBIDDEN' };
  }

  return {
    ok: true,
    document: {
      id: existing.id,
      version: existing.version,
      title: existing.title,
      summary: existing.summary,
      contentHtml: existing.contentHtml,
      contentText: existing.contentText,
      updatedAt: existing.updatedAt,
    },
  };
}
