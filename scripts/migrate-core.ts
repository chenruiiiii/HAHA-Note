/**
 * MongoDB → PostgreSQL 迁移核心（与 server-only 解耦，可被 CLI / Vitest 复用）。
 *
 * 以「运行时实际使用的集合」为准（见各 API 路由），而非 demo seed 脚本中的集合名：
 *  - ha_admin.users                      -> User（bcrypt 哈希，永不写明文）
 *  - repository.repo_list                -> Repository（owner 统归 legacyOwnerId）
 *  - repository.docs_detail              -> Document（HTML → TipTap，失败则 quarantine）
 *  - ai-chat.latest_mission/collect_mission/ai_chat_detail -> Conversation + Message
 *  - user_activity.browse_history/edit_history -> Activity（无法定位 Document 时 quarantine）
 *  - stroll-recommend.recommend_details  -> ExploreArticle
 *
 * 本模块不做任何 Prisma/DB 导入；clients 由 CLI 注入。
 */
import crypto from 'node:crypto';
import { convertDocumentHtml } from '../src/lib/content';
import { hashPassword } from '../src/lib/auth/password';

export type MigrateMode = 'dry-run' | 'execute';

export interface MigrationCounts {
  read: number;
  inserted: number;
  updated: number;
  skipped: number;
  failed: number;
}

export interface MigrationReport {
  mode: MigrateMode;
  startedAt: string;
  finishedAt: string;
  counts: Record<string, MigrationCounts>;
  quarantine: QuarantineEntry[];
}

export interface QuarantineEntry {
  source: string;
  legacyId: string;
  reason: string;
  detail?: unknown;
}

export type DbLike = {
  user: { upsert: (args: unknown) => Promise<unknown> };
  repository: { upsert: (args: unknown) => Promise<unknown> };
  document: {
    upsert: (args: unknown) => Promise<unknown>;
    findFirst: (args: unknown) => Promise<unknown>;
  };
  conversation: {
    upsert: (args: unknown) => Promise<unknown>;
    findFirst: (args: unknown) => Promise<unknown>;
  };
  message: { create: (args: unknown) => Promise<unknown> };
  activity: { create: (args: unknown) => Promise<unknown> };
  exploreArticle: { upsert: (args: unknown) => Promise<unknown> };
};

export class MigrationState {
  readonly mode: MigrateMode;
  readonly legacyOwnerId: string;
  report: MigrationReport;
  checkpointFile: string;
  quarantineFile: string;

  constructor(mode: MigrateMode, legacyOwnerId: string) {
    this.mode = mode;
    this.legacyOwnerId = legacyOwnerId;
    this.report = {
      mode,
      startedAt: new Date().toISOString(),
      finishedAt: '',
      counts: {},
      quarantine: [],
    };
    this.checkpointFile = '';
    this.quarantineFile = '';
  }

  counts(entity: string): MigrationCounts {
    return (this.report.counts[entity] ??= {
      read: 0,
      inserted: 0,
      updated: 0,
      skipped: 0,
      failed: 0,
    });
  }

  quarantine(source: string, legacyId: string, reason: string, detail?: unknown) {
    this.report.quarantine.push({ source, legacyId, reason, detail });
  }
}

export const emptyCounts = (): MigrationCounts => ({
  read: 0,
  inserted: 0,
  updated: 0,
  skipped: 0,
  failed: 0,
});

export const isBlank = (v: unknown): boolean => typeof v !== 'string' || v.trim() === '';

export const asDate = (v: unknown): Date | null => {
  if (!v) return null;
  const d = new Date(v as string);
  return Number.isNaN(d.getTime()) ? null : d;
};

export const asIso = (v: unknown): string | null => asDate(v)?.toISOString() ?? null;

// ---------------------------------------------------------------- 用户

export interface LegacyUserRow {
  username?: string;
  password?: string;
  role?: string;
  nickname?: string;
  enabled?: boolean;
}

export async function convertUser(
  state: MigrationState,
  db: DbLike,
  row: LegacyUserRow
): Promise<void> {
  const counts = state.counts('users');
  counts.read++;

  if (isBlank(row.username)) {
    state.quarantine('users', String(row.username ?? ''), 'MISSING_USERNAME');
    counts.skipped++;
    return;
  }

  const username = row.username!.trim();
  const nickname = isBlank(row.nickname) ? username : row.nickname!.trim().slice(0, 80);
  const plain = isBlank(row.password) ? null : row.password!;
  // 迁移不校验明文强度，只做哈希；无法哈希的历史空密码 -> 随机 hash + 强制重置
  const passwordHash =
    plain === null ? await hashPassword(cryptoRandom()) : await hashPassword(plain);
  const role = row.role === 'admin' ? 'ADMIN' : 'USER';
  const passwordResetRequired = plain === null;

  if (state.mode === 'execute') {
    await db.user.upsert({
      where: { username },
      update: {
        passwordHash,
        nickname,
        role,
        enabled: row.enabled !== false,
        passwordResetRequired,
      },
      create: {
        username,
        passwordHash,
        nickname,
        role,
        enabled: row.enabled !== false,
        passwordResetRequired,
      },
    });
    counts.inserted++;
  }
}

// ---------------------------------------------------------------- 仓库

export interface LegacyRepoRow {
  _id?: string;
  title?: string;
  repo_desc?: string;
  description?: string;
  type?: string;
  isPublic?: boolean;
  avatar?: string[];
  docs_list?: Array<{ docs_id: string; docs_name: string }>;
  update_time?: string;
}

export async function convertRepository(
  state: MigrationState,
  db: DbLike,
  row: LegacyRepoRow
): Promise<void> {
  const counts = state.counts('repositories');
  counts.read++;

  if (isBlank(row._id) || isBlank(row.title)) {
    state.quarantine('repositories', String(row._id ?? ''), 'INVALID_REPO');
    counts.skipped++;
    return;
  }

  const type = isBlank(row.type) ? 'book' : row.type!.trim().slice(0, 30);
  const description = !isBlank(row.repo_desc)
    ? row.repo_desc!.trim()
    : !isBlank(row.description)
      ? row.description!.trim()
      : '';

  if (state.mode === 'execute') {
    await db.repository.upsert({
      where: { id: row._id },
      update: { title: row.title!.trim(), description, type },
      create: {
        id: row._id,
        ownerId: state.legacyOwnerId,
        title: row.title!.trim(),
        description,
        type,
        visibility: row.isPublic === true ? 'PUBLIC' : 'PRIVATE',
        members: { create: { userId: state.legacyOwnerId, role: 'OWNER' } },
      },
    });
    counts.inserted++;
  }
}

// ---------------------------------------------------------------- 文档

export interface LegacyDocRow {
  _id?: string;
  repository_id?: string;
  title?: string;
  content_html?: string;
  summary?: string;
  author?: string;
  updated_at?: string;
}

export async function convertDocument(
  state: MigrationState,
  db: DbLike,
  row: LegacyDocRow
): Promise<void> {
  const counts = state.counts('documents');
  counts.read++;

  if (isBlank(row._id) || isBlank(row.repository_id)) {
    state.quarantine('documents', String(row._id ?? ''), 'MISSING_REPOSITORY');
    counts.skipped++;
    return;
  }

  const conversion = convertDocumentHtml(row.content_html ?? '');
  if (!conversion.ok) {
    state.quarantine('documents', row._id!, 'CONVERSION_FAILED', { reason: conversion.reason });
    counts.skipped++;
    return;
  }

  if (state.mode === 'execute') {
    await db.document.upsert({
      where: { id: row._id },
      update: {
        title: isBlank(row.title) ? '新建文档' : row.title!.trim(),
        contentHtml: conversion.html,
        contentText: conversion.text,
        summary: isBlank(row.summary) ? '' : row.summary!.trim(),
      },
      create: {
        id: row._id,
        repositoryId: row.repository_id!.trim(),
        creatorId: state.legacyOwnerId,
        title: isBlank(row.title) ? '新建文档' : row.title!.trim(),
        content: conversion.json,
        contentHtml: conversion.html,
        contentText: conversion.text,
        summary: isBlank(row.summary) ? '' : row.summary!.trim(),
      },
    });
    counts.inserted++;
  }
}

// ---------------------------------------------------------------- 会话与消息

export interface LegacyMessageRow {
  id?: string;
  role?: string;
  parts?: Array<Record<string, unknown>>;
}

export interface LegacyChatDetail {
  _id?: string;
  title?: string;
  summary?: string;
  category?: string;
  types?: LegacyMessageRow[];
  created_at?: string;
  updated_at?: string;
}

function messageRole(role: unknown): string {
  if (role === 'assistant') return 'ASSISTANT';
  if (role === 'system') return 'SYSTEM';
  return 'USER';
}

export async function convertConversation(
  state: MigrationState,
  db: DbLike,
  row: LegacyChatDetail,
  extra: { listTitle?: string }
): Promise<void> {
  const counts = state.counts('conversations');
  counts.read++;

  const id = row._id;
  if (isBlank(id)) {
    state.quarantine('conversations', String(id ?? ''), 'MISSING_ID');
    counts.skipped++;
    return;
  }

  const title = !isBlank(row.title)
    ? row.title!.trim()
    : !isBlank(extra.listTitle)
      ? extra.listTitle!.trim()
      : '新对话';
  const messages = Array.isArray(row.types) ? row.types : [];

  if (state.mode === 'execute') {
    await db.conversation.upsert({
      where: { id },
      update: { title, summary: row.summary ?? '', isFavorite: row.category === 'favorite' },
      create: {
        id,
        ownerId: state.legacyOwnerId,
        title,
        summary: row.summary ?? '',
        provider: 'deepseek',
        model: 'deepseek-chat',
        isFavorite: row.category === 'favorite',
        createdAt: asDate(row.created_at) ?? new Date(),
        updatedAt: asDate(row.updated_at) ?? new Date(),
      },
    });
    counts.inserted++;

    for (const msg of messages) {
      const role = messageRole(msg.role);
      const parts = Array.isArray(msg.parts) ? msg.parts : [];
      const text = parts
        .filter((p) => p?.type === 'text' && typeof p.text === 'string')
        .map((p) => p.text as string)
        .join('\n');
      await db.message.create({
        data: {
          conversationId: id,
          clientMessageId: isBlank(msg.id) ? null : msg.id!.slice(0, 120),
          role,
          status: 'COMPLETED',
          content: text,
          parts,
        },
      });
    }
  }
}

// ---------------------------------------------------------------- 活动

export interface LegacyActivityRow {
  _id?: string;
  repository_id?: string;
  docs_id?: string;
  title?: string;
  repository_name?: string;
  updated_time?: string;
}

/**
 * 历史活动迁入 Activity。
 *
 * 必须按 `docs_id` 解析目标文档（Activity.documentId 有外键约束）；
 * `docs_id` 缺失或指向不存在的文档时按 spec 隔离为 ORPHAN_DOCUMENT，
 * 不猜测归属。`type` 由来源集合决定：edit_history -> DOCUMENT_UPDATED，
 * browse_history -> DOCUMENT_VIEWED。
 */
export async function convertActivity(
  state: MigrationState,
  db: DbLike,
  row: LegacyActivityRow,
  type: 'DOCUMENT_UPDATED' | 'DOCUMENT_VIEWED' = 'DOCUMENT_UPDATED'
): Promise<void> {
  const counts = state.counts('activities');
  counts.read++;

  if (isBlank(row.docs_id)) {
    state.quarantine('activities', String(row._id ?? ''), 'ORPHAN_DOCUMENT', {
      reason: 'missing docs_id',
    });
    counts.skipped++;
    return;
  }

  const doc = await db.document.findFirst({ where: { id: row.docs_id } });
  if (!doc) {
    state.quarantine('activities', String(row._id ?? ''), 'ORPHAN_DOCUMENT', {
      docs_id: row.docs_id,
    });
    counts.skipped++;
    return;
  }

  if (state.mode === 'execute') {
    await db.activity.create({
      data: {
        id: row._id,
        userId: state.legacyOwnerId,
        documentId: String((doc as { id: string }).id),
        type,
        occurredAt: asDate(row.updated_time) ?? new Date(),
      },
    });
    counts.inserted++;
  }
}

// ---------------------------------------------------------------- 逛逛 / 公开笔记

export interface LegacyExploreRow {
  _id?: string;
  id?: string | number;
  source?: { platform?: string; title?: string; avatar?: string };
  author?: { name?: string; avatar?: string };
  title_html?: string;
  description_html?: string;
  content_html?: string;
  quality_level?: string;
  like_count?: number;
  comment_count?: number;
  word_count?: number;
  source_url?: string;
}

export async function convertExploreArticle(
  state: MigrationState,
  db: DbLike,
  row: LegacyExploreRow
): Promise<void> {
  const counts = state.counts('exploreArticles');
  counts.read++;

  const legacyId = isBlank(row._id) ? String(row.id ?? '') : row._id!;
  const numericId = row.id !== undefined && row.id !== '' ? String(row.id) : null;

  if (isBlank(legacyId)) {
    state.quarantine('exploreArticles', String(legacyId), 'MISSING_ID');
    counts.skipped++;
    return;
  }

  const titleHtml = row.title_html ?? '';
  const contentHtml = row.content_html ?? '';
  const descriptionHtml = row.description_html ?? '';

  // 逛逛内容会二次输出到公开页，先做同策略清洗；脏输入不进库
  if (isBlank(titleHtml) || isBlank(contentHtml)) {
    state.quarantine('exploreArticles', legacyId, 'EMPTY_CONTENT');
    counts.skipped++;
    return;
  }

  if (state.mode === 'execute') {
    await db.exploreArticle.upsert({
      where: { id: legacyId },
      update: {
        sourcePlatform: row.source?.platform ?? 'community',
        sourceTitle: row.source?.title ?? '',
        authorName: row.author?.name ?? '',
        titleHtml,
        descriptionHtml,
        contentHtml,
        qualityLevel: row.quality_level ?? 'normal',
      },
      create: {
        id: legacyId,
        legacyNumericId: numericId,
        sourcePlatform: row.source?.platform ?? 'community',
        sourceTitle: row.source?.title ?? '',
        sourceAvatarUrl: row.source?.avatar ?? null,
        authorName: row.author?.name ?? '',
        authorAvatarUrl: row.author?.avatar ?? null,
        titleHtml,
        descriptionHtml,
        contentHtml,
        qualityLevel: row.quality_level ?? 'normal',
        likeCount: row.like_count ?? 0,
        commentCount: row.comment_count ?? 0,
        wordCount: row.word_count ?? 0,
        sourceUrl: row.source_url ?? '',
      },
    });
    counts.inserted++;
  }
}

function cryptoRandom(): string {
  return crypto.randomBytes(24).toString('hex');
}

export function summarize(report: MigrationReport): string {
  const rows = Object.entries(report.counts).map(
    ([entity, c]) =>
      `${entity.padEnd(16)} read=${c.read} upserted=${c.inserted} skipped=${c.skipped} failed=${c.failed}`
  );
  return rows.join('\n');
}

export function isConvertibleHtml(v: unknown): boolean {
  return typeof v === 'string' && convertDocumentHtml(v).ok;
}
