import 'server-only';
import { getPrisma } from '@/lib/prisma';
import { ActivityType, DocumentStatus } from '@/generated/prisma/client';
import type { Prisma } from '@/generated/prisma/client';
import { convertDocumentHtml, emptyTiptapDoc, type TiptapDoc } from '@/lib/content';
import { toIsoDateTime } from './dto';
import { getAccessibleRepository } from './access';
import { NotFoundError, VersionConflictError, isUniqueConstraintError } from './errors';

// Prisma 的 InputJsonObject 要求可索引签名，TiptapDoc 是具体 interface，此处集中收口
const asTiptapJson = (doc: TiptapDoc): Prisma.InputJsonObject =>
  doc as unknown as Prisma.InputJsonObject;

export interface DocumentDetailRecord {
  _id: string;
  repository_id: string;
  title: string;
  content_html: string;
  summary: string;
  author: string;
  updated_at: string;
  version?: number;
}

function toDocumentDetailRecord(doc: {
  id: string;
  repositoryId: string;
  title: string;
  contentHtml: string | null;
  summary: string;
  updatedAt: Date;
  version: number;
  creator?: { nickname: string } | null;
}): DocumentDetailRecord {
  return {
    _id: doc.id,
    repository_id: doc.repositoryId,
    title: doc.title,
    content_html: doc.contentHtml ?? '',
    summary: doc.summary,
    author: doc.creator?.nickname ?? '',
    updated_at: toIsoDateTime(doc.updatedAt),
    version: doc.version,
  };
}

/**
 * 记录一次用户活动；同一 (userId, documentId, type) 只保留一行并刷新 occurredAt。
 *
 * 编辑器会自动保存，若每次保存都追加新行，首页「最近编辑」会被同一篇文档刷满，
 * 因此这里按文档去重，只把时间更新到最新一次。
 */
async function recordActivity(
  tx: Prisma.TransactionClient,
  input: { userId: string; documentId: string; type: ActivityType }
): Promise<void> {
  const existing = await tx.activity.findFirst({
    where: {
      userId: input.userId,
      documentId: input.documentId,
      type: input.type,
    },
    select: { id: true },
  });

  if (existing) {
    await tx.activity.update({
      where: { id: existing.id },
      data: { occurredAt: new Date() },
    });
    return;
  }

  await tx.activity.create({
    data: {
      userId: input.userId,
      documentId: input.documentId,
      type: input.type,
    },
  });
}

async function loadDocumentForUser(id: string, userId: string) {
  const prisma = getPrisma();
  const doc = await prisma.document.findFirst({
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

  return doc;
}

export async function findDocumentById(
  id: string,
  userId: string
): Promise<DocumentDetailRecord | null> {
  const doc = await loadDocumentForUser(id, userId);
  return doc ? toDocumentDetailRecord(doc) : null;
}

/**
 * 记录文档浏览活动，供 `/api/start/browsed` 使用。
 *
 * 同一用户重复浏览同一文档只刷新时间，不追加行。
 */
export async function markDocumentViewed(id: string, userId: string): Promise<void> {
  const prisma = getPrisma();
  await prisma.$transaction((tx) =>
    recordActivity(tx, {
      userId,
      documentId: id,
      type: ActivityType.DOCUMENT_VIEWED,
    })
  );
}

export async function updateDocument(
  id: string,
  userId: string,
  payload: {
    title?: string;
    content_html?: string;
    summary?: string;
    status?: DocumentStatus;
    baseVersion?: number;
  }
): Promise<DocumentDetailRecord> {
  const existing = await loadDocumentForUser(id, userId);

  if (!existing) {
    throw new NotFoundError('未找到对应文档');
  }

  if (typeof payload.baseVersion === 'number' && payload.baseVersion !== existing.version) {
    throw new VersionConflictError(toDocumentDetailRecord(existing));
  }

  const converted =
    payload.content_html !== undefined ? convertDocumentHtml(payload.content_html) : null;

  const prisma = getPrisma();
  const nextVersion = existing.version + 1;

  const conflictWithLatest = async () => {
    const latest = await loadDocumentForUser(id, userId);
    return new VersionConflictError(
      latest ? toDocumentDetailRecord(latest) : toDocumentDetailRecord(existing)
    );
  };

  try {
    const doc = await prisma.$transaction(async (tx) => {
      // 条件更新：只有版本仍然等于读取值时才落盘，并发下的输家返回 409 而非 500
      const guard = await tx.document.updateMany({
        where: { id, version: existing.version },
        data: {
          version: nextVersion,
          title: payload.title?.trim() || existing.title,
          summary: payload.summary ?? existing.summary ?? '',
          status: payload.status ?? existing.status,
          contentHtml: converted ? converted.html : existing.contentHtml,
          contentText: converted ? converted.text : existing.contentText,
          content: converted
            ? asTiptapJson(converted.json)
            : (existing.content as Prisma.InputJsonValue),
        },
      });

      if (guard.count === 0) {
        return null;
      }

      const updated = await tx.document.findUnique({
        where: { id },
        include: { creator: { select: { nickname: true } } },
      });

      if (!updated) {
        throw new NotFoundError('未找到对应文档');
      }

      await tx.documentRevision.create({
        data: {
          documentId: id,
          createdById: userId,
          version: nextVersion,
          title: updated.title,
          content: converted
            ? asTiptapJson(converted.json)
            : (existing.content as Prisma.InputJsonValue),
          contentHtml: updated.contentHtml,
          summary: updated.summary,
        },
      });

      await recordActivity(tx, {
        userId,
        documentId: id,
        type: ActivityType.DOCUMENT_UPDATED,
      });

      return updated;
    });

    if (!doc) {
      throw await conflictWithLatest();
    }

    return toDocumentDetailRecord(doc);
  } catch (error) {
    // DocumentRevision(documentId, version) 撞唯一约束说明并发写已抢先提交
    if (isUniqueConstraintError(error)) {
      throw await conflictWithLatest();
    }

    throw error;
  }
}

export async function createDocument(payload: {
  id?: string;
  repositoryId: string;
  creatorId: string;
  title?: string;
  contentHtml?: string;
  summary?: string;
}): Promise<DocumentDetailRecord> {
  await getAccessibleRepository(payload.repositoryId, payload.creatorId);
  const converted = convertDocumentHtml(payload.contentHtml ?? '');
  const prisma = getPrisma();

  const doc = await prisma.$transaction(async (tx) => {
    const created = await tx.document.create({
      data: {
        id: payload.id,
        repositoryId: payload.repositoryId,
        creatorId: payload.creatorId,
        title: payload.title?.trim() || '新建文档',
        content: asTiptapJson(converted.json ?? emptyTiptapDoc()),
        contentHtml: converted.html,
        contentText: converted.text,
        summary: payload.summary?.trim() || '',
        status: DocumentStatus.DRAFT,
      },
      include: { creator: { select: { nickname: true } } },
    });

    // 新建的文档同时计入「最近编辑」，否则首页刚建好的文档不会出现在该列表里
    await recordActivity(tx, {
      userId: payload.creatorId,
      documentId: created.id,
      type: ActivityType.DOCUMENT_CREATED,
    });

    await recordActivity(tx, {
      userId: payload.creatorId,
      documentId: created.id,
      type: ActivityType.DOCUMENT_UPDATED,
    });

    return created;
  });

  return toDocumentDetailRecord(doc);
}

export async function upsertDocumentForUser(
  id: string,
  userId: string,
  payload: {
    title?: string;
    content_html?: string;
    summary?: string;
    repository_id?: string;
    baseVersion?: number;
  }
): Promise<DocumentDetailRecord> {
  const existing = await loadDocumentForUser(id, userId);

  if (!existing) {
    if (!payload.repository_id?.trim()) {
      throw new NotFoundError('新建文档时 repository_id 不能为空');
    }

    return createDocument({
      id,
      repositoryId: payload.repository_id.trim(),
      creatorId: userId,
      title: payload.title,
      contentHtml: payload.content_html,
      summary: payload.summary,
    });
  }

  if (payload.repository_id && payload.repository_id !== existing.repositoryId) {
    throw new VersionConflictError(
      toDocumentDetailRecord(existing),
      '文档所属知识库不匹配，请刷新目录后重试'
    );
  }

  return updateDocument(id, userId, payload);
}
