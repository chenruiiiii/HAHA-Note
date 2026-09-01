import 'server-only';
import { getPrisma } from '@/lib/prisma';
import { RepositoryRole } from '@/generated/prisma/enums';
import type { Prisma } from '@/generated/prisma/client';

/**
 * 版本化保存结果。使用可辨识联合，供路由层映射为 HTTP 状态码。
 */
export type SaveDocumentResult =
  | {
      ok: true;
      document: DocumentSaveDto;
    }
  | {
      ok: false;
      code: 'NOT_FOUND' | 'FORBIDDEN';
    }
  | {
      ok: false;
      code: 'VERSION_CONFLICT';
      currentVersion: number;
    };

/**
 * 保存成功后返回给调用方的规范化 DTO。
 * 不暴露原始数据库记录、creatorId/repositoryId 等内部字段。
 */
export interface DocumentSaveDto {
  id: string;
  version: number;
  updatedAt: Date;
  title: string;
  summary: string;
}

export interface SaveDocumentInput {
  /** 目标文档 ID。 */
  documentId: string;
  /** 通过鉴权层（requireUser）解析出的调用者 ID，绝不来自请求体。 */
  userId: string;
  /** 客户端持有的当前版本，用于乐观并发控制。 */
  baseVersion: number;
  /** 文档标题（可选，缺省则不更新）。 */
  title?: string;
  /** 结构化 TipTap JSON 正文（可选，缺省则不更新）。 */
  content?: Prisma.InputJsonValue;
  /** 文档摘要（可选，缺省则不更新）。 */
  summary?: string;
  /** 客户端生成的请求幂等键（可选）。重复提交不再次自增版本。 */
  requestId?: string;
  /** 是否在保存前为上一已提交版本写入 revision 快照（可选，默认 false）。 */
  createRevision?: boolean;
}

/**
 * requestId 幂等去重表（进程内轻量实现）。
 *
 * key 为 `${documentId}:${requestId}`，value 为该请求提交后文档的版本号。
 * 参见 design.md：先采用进程内去重，若实测重复率上升再落库唯一约束。
 */
const committedRequestIds = new Map<string, number>();

/** 去重表上限，超出后整表清空，避免无界增长。 */
const DEDUPE_MAX_ENTRIES = 10_000;

function rememberRequestId(documentId: string, requestId: string, committedVersion: number) {
  if (committedRequestIds.size >= DEDUPE_MAX_ENTRIES) {
    committedRequestIds.clear();
  }
  committedRequestIds.set(`${documentId}:${requestId}`, committedVersion);
}

/** 供单测重置去重表，避免用例间互相污染。 */
export function __resetSaveDocumentDedupeForTest(): void {
  committedRequestIds.clear();
}

/**
 * 判断调用者是否有权保存指定文档：文档创建者、所属仓库 owner，或仓库 OWNER/EDITOR 成员。
 */
function canEdit(
  document: {
    creatorId: string;
    repository: {
      ownerId: string;
      members: Array<{ userId: string; role: string }>;
    };
  },
  userId: string
): boolean {
  if (document.creatorId === userId) return true;
  if (document.repository.ownerId === userId) return true;
  return document.repository.members.some(
    (member) =>
      member.userId === userId &&
      (member.role === RepositoryRole.OWNER || member.role === RepositoryRole.EDITOR)
  );
}

/**
 * 以乐观并发方式保存文档。
 *
 * 仅当 `baseVersion` 等于存储版本时执行原子更新并自增版本；否则回读最新版本返回冲突，
 * 绝不覆盖服务端已提交的内容。权限校验基于数据库中的 creator/repository 关系，
 * 不信任请求体中的 creatorId/author/ownerId。
 */
export async function saveDocument(input: SaveDocumentInput): Promise<SaveDocumentResult> {
  const prisma = getPrisma();
  const { documentId, userId, baseVersion, requestId, createRevision } = input;

  const existing = await prisma.document.findUnique({
    where: { id: documentId },
    select: {
      creatorId: true,
      deletedAt: true,
      version: true,
      title: true,
      content: true,
      contentHtml: true,
      summary: true,
      repository: {
        select: {
          ownerId: true,
          members: {
            select: { userId: true, role: true },
          },
        },
      },
    },
  });

  if (!existing || existing.deletedAt) {
    return { ok: false, code: 'NOT_FOUND' };
  }

  if (!canEdit(existing, userId)) {
    return { ok: false, code: 'FORBIDDEN' };
  }

  // 幂等去重：同一 requestId 已提交过时，不再重复自增版本。
  if (requestId) {
    const committedVersion = committedRequestIds.get(`${documentId}:${requestId}`);
    if (committedVersion !== undefined) {
      // 当前版本仍等于该请求提交后的版本 → 幂等返回成功（不重复自增）。
      if (existing.version === committedVersion) {
        const replay = await readDocumentDto(documentId);
        if (!replay) return { ok: false, code: 'NOT_FOUND' };
        return { ok: true, document: replay };
      }
      // 期间已有他方保存推进版本 → 返回冲突。
      return { ok: false, code: 'VERSION_CONFLICT', currentVersion: existing.version };
    }
  }

  const data: Prisma.DocumentUpdateManyMutationInput = {
    version: { increment: 1 },
  };
  if (input.title !== undefined) data.title = input.title;
  if (input.content !== undefined) data.content = input.content;
  if (input.summary !== undefined) data.summary = input.summary;

  const result = await prisma.document.updateMany({
    where: { id: documentId, version: baseVersion },
    data,
  });

  if (result.count === 0) {
    const latest = await prisma.document.findUnique({
      where: { id: documentId },
      select: { version: true },
    });
    return {
      ok: false,
      code: 'VERSION_CONFLICT',
      currentVersion: latest?.version ?? baseVersion,
    };
  }

  // 保存成功后，为上一已提交版本（baseVersion）写入 revision 快照。
  // 失败不阻塞保存（唯一冲突/瞬时错误仅忽略），符合「至多一个且不阻塞保存」。
  if (createRevision) {
    try {
      await prisma.documentRevision.create({
        data: {
          documentId,
          createdById: userId,
          version: baseVersion,
          title: existing.title,
          content: existing.content as Prisma.InputJsonValue,
          contentHtml: existing.contentHtml,
          summary: existing.summary,
        },
      });
    } catch {
      // 已存在该版本快照或瞬时错误：忽略，保存本身已成功。
    }
  }

  if (requestId) {
    rememberRequestId(documentId, requestId, baseVersion + 1);
  }

  const saved = await readDocumentDto(documentId);
  if (!saved) return { ok: false, code: 'NOT_FOUND' };

  return { ok: true, document: saved };
}

async function readDocumentDto(documentId: string): Promise<DocumentSaveDto | null> {
  const prisma = getPrisma();
  const doc = await prisma.document.findUnique({
    where: { id: documentId },
    select: {
      id: true,
      version: true,
      updatedAt: true,
      title: true,
      summary: true,
    },
  });

  return doc ?? null;
}

export interface CreateDocumentInput {
  /** 目标文档 ID（客户端生成，沿用 legacy ID 保证 URL 稳定）。 */
  documentId: string;
  /** 文档所属仓库 ID。 */
  repositoryId: string;
  /** 通过鉴权层解析出的调用者 ID。 */
  userId: string;
  /** 文档标题（可选，缺省为「新建文档」）。 */
  title?: string;
  /** 结构化 TipTap JSON 正文（可选）。 */
  content?: Prisma.InputJsonValue;
  /** 消毒后的 HTML 正文（可选）。 */
  contentHtml?: string;
  /** 纯文本摘要（可选）。 */
  summary?: string;
}

export type CreateDocumentResult =
  | { ok: true; document: DocumentSaveDto }
  | { ok: false; code: 'NOT_FOUND' | 'FORBIDDEN' };

/**
 * 在指定仓库下创建新文档（版本初始为 1）。
 * 调用者必须是仓库 owner 或 OWNER/EDITOR 成员。
 */
export async function createDocument(
  input: CreateDocumentInput
): Promise<CreateDocumentResult> {
  const prisma = getPrisma();
  const { documentId, repositoryId, userId } = input;

  const repository = await prisma.repository.findUnique({
    where: { id: repositoryId },
    select: {
      ownerId: true,
      deletedAt: true,
      members: {
        select: { userId: true, role: true },
      },
    },
  });

  if (!repository || repository.deletedAt) {
    return { ok: false, code: 'NOT_FOUND' };
  }

  const canWrite =
    repository.ownerId === userId ||
    repository.members.some(
      (member) =>
        member.userId === userId &&
        (member.role === RepositoryRole.OWNER || member.role === RepositoryRole.EDITOR)
    );

  if (!canWrite) {
    return { ok: false, code: 'FORBIDDEN' };
  }

  const created = await prisma.document.create({
    data: {
      id: documentId,
      repositoryId,
      creatorId: userId,
      title: input.title ?? '新建文档',
      content: (input.content ?? { type: 'doc', content: [] }) as Prisma.InputJsonValue,
      contentHtml: input.contentHtml ?? null,
      summary: input.summary ?? '',
      version: 1,
    },
    select: {
      id: true,
      version: true,
      updatedAt: true,
      title: true,
      summary: true,
    },
  });

  return { ok: true, document: created };
}
