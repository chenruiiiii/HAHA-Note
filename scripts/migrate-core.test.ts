import { describe, it, expect } from 'vitest';
import {
  MigrationState,
  convertUser,
  convertDocument,
  convertRepository,
  convertExploreArticle,
  convertConversation,
  convertActivity,
  type DbLike,
} from './migrate-core';

function makeDb(options?: {
  document?: { id: string } | null;
}): { db: DbLike; calls: Array<{ op: string; entity: string; args: unknown }> } {
  const calls: Array<{ op: string; entity: string; args: unknown }> = [];
  const documentRow = options?.document ?? null;
  const record =
    (entity: string, op: string) =>
    (args: unknown): Promise<unknown> => {
      calls.push({ op, entity, args });
      return Promise.resolve({});
    };
  const db: DbLike = {
    user: { upsert: record('user', 'upsert') },
    repository: { upsert: record('repository', 'upsert') },
    document: {
      upsert: record('document', 'upsert'),
      findFirst: () => Promise.resolve(documentRow),
    },
    conversation: {
      upsert: record('conversation', 'upsert'),
      findFirst: () => Promise.resolve(null),
    },
    message: { create: record('message', 'create') },
    activity: { create: record('activity', 'create') },
    exploreArticle: { upsert: record('exploreArticle', 'upsert') },
  };
  return { db, calls };
}

describe('migrate-core field mapping', () => {
  it('dry-run never writes to the target db', async () => {
    const state = new MigrationState('dry-run', 'owner-1');
    const { db, calls } = makeDb();
    await convertUser(state, db, { username: 'admin', password: 'x', role: 'admin' });
    await convertRepository(state, db, { _id: 'R_1', title: 'T', isPublic: true });
    await convertDocument(state, db, { _id: 'D_1', repository_id: 'R_1', content_html: '<p>hi</p>' });
    expect(calls).toHaveLength(0);
    expect(state.report.quarantine).toHaveLength(0);
  });

  it('maps admin role to ADMIN and hashes the password', async () => {
    const state = new MigrationState('execute', 'owner-1');
    const { db, calls } = makeDb();
    await convertUser(state, db, { username: 'admin', password: 'pw', role: 'admin' });
    const userCall = calls.find((c) => c.entity === 'user')!;
    const args = userCall.args as {
      create: { passwordHash: string; role: string; passwordResetRequired: boolean };
    };
    expect(args.create.role).toBe('ADMIN');
    expect(args.create.passwordResetRequired).toBe(false);
    expect(args.create.passwordHash).not.toContain('pw');
  });

  it('marks users without a password as reset-required and unguessable hash', async () => {
    const state = new MigrationState('execute', 'owner-1');
    const { db, calls } = makeDb();
    await convertUser(state, db, { username: 'ghost' });
    const args = calls[0].args as {
      create: { passwordResetRequired: boolean; passwordHash: string };
    };
    expect(args.create.passwordResetRequired).toBe(true);
    expect(args.create.passwordHash).not.toBe('');
  });

  it('quarantines a username-less user', async () => {
    const state = new MigrationState('execute', 'owner-1');
    const { db } = makeDb();
    await convertUser(state, db, { username: '' });
    expect(state.report.quarantine.some((q) => q.reason === 'MISSING_USERNAME')).toBe(true);
  });

  it('defaults legacy repositories to PRIVATE when isPublic is not true', async () => {
    const state = new MigrationState('execute', 'owner-1');
    const { db, calls } = makeDb();
    await convertRepository(state, db, { _id: 'R_1', title: 'T' });
    const args = calls[0].args as { create: { visibility: string; ownerId: string } };
    expect(args.create.visibility).toBe('PRIVATE');
    expect(args.create.ownerId).toBe('owner-1');
  });

  it('keeps content and writes a document when HTML converts cleanly', async () => {
    const state = new MigrationState('execute', 'owner-1');
    const { db, calls } = makeDb();
    await convertDocument(state, db, {
      _id: 'D_1',
      repository_id: 'R_1',
      content_html: '<p>ok</p>',
    });
    expect(state.report.quarantine).toHaveLength(0);
    expect(calls.some((c) => c.entity === 'document')).toBe(true);
  });

  it('quarantines documents without repository_id', async () => {
    const state = new MigrationState('execute', 'owner-1');
    const { db } = makeDb();
    await convertDocument(state, db, { _id: 'D_1' });
    expect(state.report.quarantine.some((q) => q.reason === 'MISSING_REPOSITORY')).toBe(true);
  });

  it('maps explore article numeric id to legacyNumericId', async () => {
    const state = new MigrationState('execute', 'owner-1');
    const { db, calls } = makeDb();
    await convertExploreArticle(state, db, {
      _id: 'stroll_0001',
      id: 1001,
      source: { platform: 'yuque', title: '语雀' },
      author: { name: '官方' },
      title_html: '<h2>标题</h2>',
      content_html: '<p>正文</p>',
      source_url: 'https://x',
    });
    const args = calls[0].args as { create: { legacyNumericId: string | null; id: string } };
    expect(args.create.id).toBe('stroll_0001');
    expect(args.create.legacyNumericId).toBe('1001');
  });

  it('maps conversation messages with role and text parts', async () => {
    const state = new MigrationState('execute', 'owner-1');
    const { db, calls } = makeDb();
    await convertConversation(
      state,
      db,
      {
        _id: 'AIM_01',
        title: 't',
        category: 'favorite',
        types: [
          { id: 'm1', role: 'user', parts: [{ type: 'text', text: 'hi' }] },
          { id: 'm2', role: 'assistant', parts: [{ type: 'text', text: 'yo' }] },
        ],
      },
      {}
    );
    const conv = calls.find((c) => c.entity === 'conversation')!;
    const convArgs = conv.args as { create: { isFavorite: boolean; ownerId: string } };
    expect(convArgs.create.isFavorite).toBe(true);
    expect(convArgs.create.ownerId).toBe('owner-1');
    const messages = calls.filter((c) => c.entity === 'message');
    expect(messages).toHaveLength(2);
    const msgArgs = messages[1].args as { data: { role: string; content: string } };
    expect(msgArgs.data.role).toBe('ASSISTANT');
    expect(msgArgs.data.content).toBe('yo');
  });

  it('counts and summarize report shape', () => {
    const state = new MigrationState('dry-run', 'owner-1');
    const { db } = makeDb();
    void db;
    expect(state.report.counts).toEqual({});
    state.counts('documents');
    expect(state.report.counts.documents).toBeDefined();
  });

  it('maps activity via docs_id and keeps browse type distinct', async () => {
    const state = new MigrationState('execute', 'owner-1');
    const { db, calls } = makeDb({ document: { id: 'D_1' } });

    await convertActivity(
      state,
      db,
      { _id: 'EDIT_1', repository_id: 'R_1', docs_id: 'D_1', updated_time: '2026-04-16T10:00:00Z' },
      'DOCUMENT_UPDATED'
    );
    await convertActivity(
      state,
      db,
      { _id: 'BROWSE_1', repository_id: 'R_1', docs_id: 'D_1' },
      'DOCUMENT_VIEWED'
    );

    const activities = calls.filter((c) => c.entity === 'activity');
    expect(activities).toHaveLength(2);
    const first = activities[0].args as { data: { documentId: string; type: string } };
    const second = activities[1].args as { data: { type: string } };
    expect(first.data.documentId).toBe('D_1');
    expect(first.data.type).toBe('DOCUMENT_UPDATED');
    expect(second.data.type).toBe('DOCUMENT_VIEWED');
    expect(state.report.quarantine).toHaveLength(0);
  });

  it('quarantines activities missing docs_id or pointing at a missing document', async () => {
    const state = new MigrationState('execute', 'owner-1');
    const { db } = makeDb({ document: null });

    // 缺 docs_id（旧种子数据的典型形态）
    await convertActivity(state, db, { _id: 'EDIT_1', repository_id: 'R_1' });
    // docs_id 指向不存在的文档
    await convertActivity(state, db, { _id: 'BROWSE_1', docs_id: 'D_missing' });

    const reasons = state.report.quarantine.map((q) => q.reason);
    expect(reasons).toEqual(['ORPHAN_DOCUMENT', 'ORPHAN_DOCUMENT']);
    expect(state.report.counts.activities.skipped).toBe(2);
  });
});
