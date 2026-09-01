import { describe, it, expect } from 'vitest';
import {
  autosaveReducer,
  initialAutosaveState,
  type AutosaveAction,
} from './reducer';

function state(overrides: Partial<ReturnType<typeof initialAutosaveState>> = {}) {
  return { ...initialAutosaveState(1), ...overrides };
}

function reduce(prev: ReturnType<typeof initialAutosaveState>, action: AutosaveAction) {
  return autosaveReducer(prev, action);
}

describe('autosaveReducer', () => {
  it('saved + EDIT → dirty', () => {
    expect(reduce(state({ status: 'saved' }), { type: 'EDIT' })).toEqual(
      state({ status: 'dirty', error: null })
    );
  });

  it('dirty + SAVE_START → saving', () => {
    expect(reduce(state({ status: 'dirty' }), { type: 'SAVE_START' })).toEqual(
      state({ status: 'saving', error: null })
    );
  });

  it('saving + SAVE_SUCCESS → saved（版本更新、retryCount 归零）', () => {
    const s = state({ status: 'saving', retryCount: 3 });
    const result = reduce(s, { type: 'SAVE_SUCCESS', version: 5 });
    expect(result.status).toBe('saved');
    expect(result.version).toBe(5);
    expect(result.retryCount).toBe(0);
    expect(result.lastSavedAt).toBeTypeOf('number');
  });

  it('saving + SAVE_TRANSIENT_ERROR → retrying（retryCount 自增）', () => {
    const result = reduce(state({ status: 'saving' }), { type: 'SAVE_TRANSIENT_ERROR' });
    expect(result.status).toBe('retrying');
    expect(result.retryCount).toBe(1);
  });

  it('retrying + RETRY → saving', () => {
    const result = reduce(state({ status: 'retrying', retryCount: 2 }), { type: 'RETRY' });
    expect(result.status).toBe('saving');
    expect(result.error).toBeNull();
  });

  it('retrying + SAVE_SUCCESS → saved', () => {
    const result = reduce(state({ status: 'retrying', retryCount: 2 }), {
      type: 'SAVE_SUCCESS',
      version: 4,
    });
    expect(result.status).toBe('saved');
    expect(result.retryCount).toBe(0);
  });

  it('saving + SAVE_PERMANENT_ERROR → error', () => {
    const result = reduce(state({ status: 'saving' }), {
      type: 'SAVE_PERMANENT_ERROR',
      message: '权限不足',
    });
    expect(result.status).toBe('error');
    expect(result.error).toBe('权限不足');
  });

  it('error + EDIT → dirty', () => {
    expect(reduce(state({ status: 'error', error: 'x' }), { type: 'EDIT' })).toEqual(
      state({ status: 'dirty', error: null })
    );
  });

  it('error + RETRY → saving', () => {
    expect(reduce(state({ status: 'error' }), { type: 'RETRY' })).toEqual(
      state({ status: 'saving', error: null })
    );
  });

  it('saving + CONFLICT → conflict（携带 conflictVersion）', () => {
    const result = reduce(state({ status: 'saving', version: 3 }), {
      type: 'CONFLICT',
      currentVersion: 7,
    });
    expect(result.status).toBe('conflict');
    expect(result.conflictVersion).toBe(7);
  });

  it('conflict + EDIT → 保持 conflict（不允许编辑绕过冲突）', () => {
    const s = state({ status: 'conflict', conflictVersion: 7 });
    expect(reduce(s, { type: 'EDIT' })).toBe(s);
  });

  it('conflict + RESOLVE_CONFLICT_LOAD_SERVER → saved', () => {
    const result = reduce(state({ status: 'conflict', conflictVersion: 7 }), {
      type: 'RESOLVE_CONFLICT_LOAD_SERVER',
      version: 7,
    });
    expect(result.status).toBe('saved');
    expect(result.version).toBe(7);
    expect(result.conflictVersion).toBeNull();
  });

  it('conflict + RESOLVE_CONFLICT_KEEP_LOCAL → dirty（以服务端版本为新 base）', () => {
    const result = reduce(state({ status: 'conflict', conflictVersion: 7 }), {
      type: 'RESOLVE_CONFLICT_KEEP_LOCAL',
      newBaseVersion: 7,
    });
    expect(result.status).toBe('dirty');
    expect(result.version).toBe(7);
    expect(result.conflictVersion).toBeNull();
  });

  it('任意 + GO_OFFLINE → offline（conflict 除外）', () => {
    expect(reduce(state({ status: 'saved' }), { type: 'GO_OFFLINE' }).status).toBe('offline');
    expect(reduce(state({ status: 'dirty' }), { type: 'GO_OFFLINE' }).status).toBe('offline');
    expect(reduce(state({ status: 'saving' }), { type: 'GO_OFFLINE' }).status).toBe('offline');
    // conflict 时不转为 offline
    expect(reduce(state({ status: 'conflict' }), { type: 'GO_OFFLINE' }).status).toBe('conflict');
  });

  it('offline + GO_ONLINE(hasPending) → dirty', () => {
    expect(
      reduce(state({ status: 'offline' }), { type: 'GO_ONLINE', hasPendingChanges: true }).status
    ).toBe('dirty');
  });

  it('offline + GO_ONLINE(!hasPending) → saved', () => {
    expect(
      reduce(state({ status: 'offline' }), { type: 'GO_ONLINE', hasPendingChanges: false }).status
    ).toBe('saved');
  });

  it('saving + EDIT → 保持 saving（latestRef 串行化）', () => {
    const s = state({ status: 'saving' });
    expect(reduce(s, { type: 'EDIT' })).toBe(s);
  });

  it('offline + EDIT → 保持 offline', () => {
    const s = state({ status: 'offline' });
    expect(reduce(s, { type: 'EDIT' })).toBe(s);
  });

  it('RESET 重置到初始 saved 状态', () => {
    const result = reduce(state({ status: 'conflict', conflictVersion: 9, retryCount: 5 }), {
      type: 'RESET',
      version: 1,
    });
    expect(result).toEqual(initialAutosaveState(1));
  });

  it('SAVE_START 在非 dirty/retrying/error 状态下为 no-op', () => {
    const s = state({ status: 'saved' });
    expect(reduce(s, { type: 'SAVE_START' })).toBe(s);
  });
});
