import { describe, it, expect, vi, beforeEach } from 'vitest';

// `server-only` 在测试环境会 throw，这里用 mock 使其变成空模块。
vi.mock('server-only', () => ({}));

const prismaMock = {
  document: {
    findUnique: vi.fn(),
    updateMany: vi.fn(),
    create: vi.fn(),
  },
  documentRevision: {
    create: vi.fn(),
  },
  repository: {
    findUnique: vi.fn(),
  },
};

vi.mock('@/lib/prisma', () => ({
  getPrisma: () => prismaMock,
}));

import {
  saveDocument,
  createDocument,
  __resetSaveDocumentDedupeForTest,
  type SaveDocumentInput,
} from './document-save';

function makeInput(overrides: Partial<SaveDocumentInput> = {}): SaveDocumentInput {
  return {
    documentId: 'doc-1',
    userId: 'user-1',
    baseVersion: 3,
    title: '新标题',
    content: { type: 'doc', content: [] },
    ...overrides,
  };
}

function existingDocument(overrides: Record<string, unknown> = {}) {
  return {
    id: 'doc-1',
    creatorId: 'user-1',
    deletedAt: null,
    version: 3,
    title: '原标题',
    content: { type: 'doc', content: [{ type: 'paragraph' }] },
    contentHtml: '<p>原标题</p>',
    summary: '原摘要',
    repository: {
      ownerId: 'owner-1',
      members: [],
    },
    ...overrides,
  };
}

function savedDocumentDto(overrides: Record<string, unknown> = {}) {
  return {
    id: 'doc-1',
    version: 4,
    updatedAt: new Date('2026-09-01T12:00:00Z'),
    title: '新标题',
    summary: '摘要',
    ...overrides,
  };
}

describe('saveDocument', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    __resetSaveDocumentDedupeForTest();
  });

  it('版本匹配时原子更新并自增版本，返回新 DTO', async () => {
    prismaMock.document.findUnique
      .mockResolvedValueOnce(existingDocument())
      .mockResolvedValueOnce(savedDocumentDto());
    prismaMock.document.updateMany.mockResolvedValueOnce({ count: 1 });

    const result = await saveDocument(makeInput());

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.document.version).toBe(4);
      expect(result.document.title).toBe('新标题');
    }

    expect(prismaMock.document.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'doc-1', version: 3 },
        data: expect.objectContaining({
          version: { increment: 1 },
          title: '新标题',
        }),
      })
    );
  });

  it('版本陈旧时返回冲突，携带当前版本且不覆盖', async () => {
    prismaMock.document.findUnique
      .mockResolvedValueOnce(existingDocument())
      .mockResolvedValueOnce({ version: 7 });
    prismaMock.document.updateMany.mockResolvedValueOnce({ count: 0 });

    const result = await saveDocument(makeInput({ baseVersion: 3 }));

    expect(result).toEqual({
      ok: false,
      code: 'VERSION_CONFLICT',
      currentVersion: 7,
    });
  });

  it('非 owner/editor 返回 FORBIDDEN', async () => {
    prismaMock.document.findUnique.mockResolvedValueOnce(
      existingDocument({
        creatorId: 'other-user',
        repository: {
          ownerId: 'other-owner',
          members: [{ userId: 'user-1', role: 'VIEWER' }],
        },
      })
    );

    const result = await saveDocument(makeInput({ userId: 'user-1' }));

    expect(result).toEqual({ ok: false, code: 'FORBIDDEN' });
    expect(prismaMock.document.updateMany).not.toHaveBeenCalled();
  });

  it('仓库 OWNER/EDITOR 成员有权保存', async () => {
    prismaMock.document.findUnique
      .mockResolvedValueOnce(
        existingDocument({
          creatorId: 'other-user',
          repository: {
            ownerId: 'other-owner',
            members: [{ userId: 'user-1', role: 'EDITOR' }],
          },
        })
      )
      .mockResolvedValueOnce(savedDocumentDto());
    prismaMock.document.updateMany.mockResolvedValueOnce({ count: 1 });

    const result = await saveDocument(makeInput({ userId: 'user-1' }));

    expect(result.ok).toBe(true);
  });

  it('文档不存在返回 NOT_FOUND', async () => {
    prismaMock.document.findUnique.mockResolvedValueOnce(null);

    const result = await saveDocument(makeInput());

    expect(result).toEqual({ ok: false, code: 'NOT_FOUND' });
    expect(prismaMock.document.updateMany).not.toHaveBeenCalled();
  });

  it('文档已删除返回 NOT_FOUND', async () => {
    prismaMock.document.findUnique.mockResolvedValueOnce(
      existingDocument({ deletedAt: new Date() })
    );

    const result = await saveDocument(makeInput());

    expect(result).toEqual({ ok: false, code: 'NOT_FOUND' });
  });

  it('可选字段缺省时不写入 data', async () => {
    prismaMock.document.findUnique
      .mockResolvedValueOnce(existingDocument())
      .mockResolvedValueOnce(savedDocumentDto());
    prismaMock.document.updateMany.mockResolvedValueOnce({ count: 1 });

    await saveDocument(makeInput({ title: undefined, content: undefined, summary: undefined }));

    const updateArgs = prismaMock.document.updateMany.mock.calls[0][0];
    expect(updateArgs.data).toEqual({ version: { increment: 1 } });
  });
});

describe('saveDocument requestId 幂等去重', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    __resetSaveDocumentDedupeForTest();
  });

  it('重复 requestId 不再次自增版本，返回首次提交版本', async () => {
    // 首次提交：version 3 -> 4
    prismaMock.document.findUnique
      .mockResolvedValueOnce(existingDocument())
      .mockResolvedValueOnce(savedDocumentDto());
    prismaMock.document.updateMany.mockResolvedValueOnce({ count: 1 });

    const first = await saveDocument(makeInput({ requestId: 'req-1' }));
    expect(first.ok).toBe(true);

    vi.clearAllMocks();

    // 重试：当前文档 version 仍为 4（与首次提交后一致），应幂等返回成功，不再自增
    prismaMock.document.findUnique
      .mockResolvedValueOnce(
        existingDocument({ version: 4, title: '新标题', summary: '摘要' })
      )
      .mockResolvedValueOnce(savedDocumentDto());

    const second = await saveDocument(
      makeInput({ requestId: 'req-1', baseVersion: 4 })
    );

    expect(second.ok).toBe(true);
    expect(prismaMock.document.updateMany).not.toHaveBeenCalled();
  });

  it('重试时他方已保存推进版本，返回 409', async () => {
    prismaMock.document.findUnique
      .mockResolvedValueOnce(existingDocument())
      .mockResolvedValueOnce(savedDocumentDto());
    prismaMock.document.updateMany.mockResolvedValueOnce({ count: 1 });

    const first = await saveDocument(makeInput({ requestId: 'req-1' }));
    expect(first.ok).toBe(true);

    vi.clearAllMocks();

    // 期间他方保存，version 推进到 5
    prismaMock.document.findUnique.mockResolvedValueOnce(
      existingDocument({ version: 5 })
    );

    const second = await saveDocument(
      makeInput({ requestId: 'req-1', baseVersion: 4 })
    );

    expect(second).toEqual({
      ok: false,
      code: 'VERSION_CONFLICT',
      currentVersion: 5,
    });
    expect(prismaMock.document.updateMany).not.toHaveBeenCalled();
  });
});

describe('saveDocument createRevision 快照', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    __resetSaveDocumentDedupeForTest();
  });

  it('createRevision=true 时写入上一版本的 revision 快照', async () => {
    prismaMock.document.findUnique
      .mockResolvedValueOnce(existingDocument())
      .mockResolvedValueOnce(savedDocumentDto());
    prismaMock.document.updateMany.mockResolvedValueOnce({ count: 1 });
    prismaMock.documentRevision.create.mockResolvedValueOnce({});

    const result = await saveDocument(makeInput({ createRevision: true }));

    expect(result.ok).toBe(true);
    expect(prismaMock.documentRevision.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          documentId: 'doc-1',
          version: 3,
          title: '原标题',
        }),
      })
    );
  });

  it('createRevision 缺省时不写 revision', async () => {
    prismaMock.document.findUnique
      .mockResolvedValueOnce(existingDocument())
      .mockResolvedValueOnce(savedDocumentDto());
    prismaMock.document.updateMany.mockResolvedValueOnce({ count: 1 });

    await saveDocument(makeInput());

    expect(prismaMock.documentRevision.create).not.toHaveBeenCalled();
  });

  it('revision 写入失败不阻塞保存', async () => {
    prismaMock.document.findUnique
      .mockResolvedValueOnce(existingDocument())
      .mockResolvedValueOnce(savedDocumentDto());
    prismaMock.document.updateMany.mockResolvedValueOnce({ count: 1 });
    prismaMock.documentRevision.create.mockRejectedValueOnce(new Error('unique'));

    const result = await saveDocument(makeInput({ createRevision: true }));

    expect(result.ok).toBe(true);
  });
});

describe('createDocument', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('仓库 owner 可创建文档', async () => {
    prismaMock.repository.findUnique.mockResolvedValueOnce({
      ownerId: 'user-1',
      deletedAt: null,
      members: [],
    });
    prismaMock.document.create.mockResolvedValueOnce(savedDocumentDto({ version: 1 }));

    const result = await createDocument({
      documentId: 'doc-new',
      repositoryId: 'repo-1',
      userId: 'user-1',
      title: '新建文档',
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.document.version).toBe(1);
    }
    expect(prismaMock.document.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          id: 'doc-new',
          repositoryId: 'repo-1',
          creatorId: 'user-1',
          version: 1,
        }),
      })
    );
  });

  it('非 owner/editor 创建返回 FORBIDDEN', async () => {
    prismaMock.repository.findUnique.mockResolvedValueOnce({
      ownerId: 'other',
      deletedAt: null,
      members: [{ userId: 'user-1', role: 'VIEWER' }],
    });

    const result = await createDocument({
      documentId: 'doc-new',
      repositoryId: 'repo-1',
      userId: 'user-1',
    });

    expect(result).toEqual({ ok: false, code: 'FORBIDDEN' });
    expect(prismaMock.document.create).not.toHaveBeenCalled();
  });
});
