'use client';

import { useCallback, useEffect, useReducer, useRef } from 'react';
import {
  autosaveReducer,
  initialAutosaveState,
  type AutosaveState,
} from './reducer';

export interface SavePayload {
  title: string;
  content: unknown;
}

export interface VersionedSaveResponse {
  version: number;
}

export interface UseDocumentAutosaveOptions {
  documentId: string;
  initialVersion: number;
  /** 实际执行保存的函数，返回新版本号；抛异常表示失败。 */
  saveFn: (payload: SavePayload, baseVersion: number, requestId: string) => Promise<VersionedSaveResponse>;
  /** debounce 延迟（ms），默认 1000。 */
  debounceMs?: number;
  /** 最大重试次数，默认 5。 */
  maxRetries?: number;
}

export interface UseDocumentAutosaveReturn {
  state: AutosaveState;
  /** 标记内容已变更，触发 debounce 自动保存。 */
  notifyEdit: (payload: SavePayload) => void;
  /** 手动触发立即保存（Ctrl+S / 离页前）。 */
  flushSave: () => Promise<void>;
  /** 冲突解决：加载服务端版本。 */
  resolveConflictLoadServer: (serverVersion: number) => void;
  /** 冲突解决：保留本地内容，以服务端版本为新 base。 */
  resolveConflictKeepLocal: (serverVersion: number) => void;
}

export function useDocumentAutosave(
  options: UseDocumentAutosaveOptions
): UseDocumentAutosaveReturn {
  const { documentId, initialVersion, saveFn, debounceMs = 1000, maxRetries = 5 } = options;

  const [state, dispatch] = useReducer(autosaveReducer, initialVersion, initialAutosaveState);

  // latestRef：始终保存最新的编辑内容，实现串行化排队
  const latestRef = useRef<SavePayload | null>(null);
  // inflightRef：标记当前是否有保存请求在飞行中
  const inflightRef = useRef(false);
  // debounce timer
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // baseVersion ref：始终与 state.version 同步，供 saveFn 使用
  const baseVersionRef = useRef(initialVersion);
  // saveFn ref：避免依赖变化导致 effect 重建
  const saveFnRef = useRef(saveFn);
  // 是否有未保存的变更（用于离页提示）
  const hasPendingRef = useRef(false);

  useEffect(() => {
    saveFnRef.current = saveFn;
  }, [saveFn]);

  useEffect(() => {
    baseVersionRef.current = state.version;
  }, [state.version]);

  // doSaveRef：打破 useCallback 自引用循环（react-hooks/immutability）
  const doSaveRef = useRef<() => Promise<void>>(async () => {});

  // ─── 核心保存逻辑 ───
  const doSave = useCallback(async () => {
    const payload = latestRef.current;
    if (!payload || inflightRef.current) return;

    inflightRef.current = true;
    dispatch({ type: 'SAVE_START' });

    const requestId = `${documentId}:${baseVersionRef.current}:${Date.now()}:${Math.random().toString(36).slice(2, 8)}`;

    try {
      const result = await saveFnRef.current(payload, baseVersionRef.current, requestId);
      baseVersionRef.current = result.version;
      hasPendingRef.current = false;
      dispatch({ type: 'SAVE_SUCCESS', version: result.version });

      // 串行化：保存期间如果有新编辑排队，继续保存
      if (latestRef.current && !objectsEqual(latestRef.current, payload)) {
        inflightRef.current = false;
        doSaveRef.current();
      } else {
        inflightRef.current = false;
      }
    } catch (err: unknown) {
      inflightRef.current = false;

      // 409 冲突：停止重试
      if (isConflictError(err)) {
        const currentVersion = (err as ConflictError).currentVersion;
        dispatch({ type: 'CONFLICT', currentVersion });
        return;
      }

      // 永久性错误（403/401/422）：停止重试
      if (isPermanentError(err)) {
        dispatch({ type: 'SAVE_PERMANENT_ERROR', message: getErrorMessage(err) });
        return;
      }

      // 瞬态错误：进入 retrying
      dispatch({ type: 'SAVE_TRANSIENT_ERROR', message: getErrorMessage(err) });
    }
  }, [documentId]);

  // 同步 doSaveRef，使递归调用使用最新闭包
  useEffect(() => {
    doSaveRef.current = doSave;
  }, [doSave]);

  // ─── 重试逻辑（指数退避）───
  useEffect(() => {
    if (state.status !== 'retrying') return;
    if (state.retryCount > maxRetries) {
      dispatch({ type: 'SAVE_PERMANENT_ERROR', message: '重试次数过多，请手动保存' });
      return;
    }

    const backoff = Math.min(1000 * 2 ** state.retryCount, 30000);
    const timer = setTimeout(() => {
      if (typeof navigator !== 'undefined' && !navigator.onLine) return;
      dispatch({ type: 'RETRY' });
      void doSave();
    }, backoff);

    return () => clearTimeout(timer);
  }, [state.status, state.retryCount, maxRetries, doSave]);

  // ─── 在线/离线监听 ───
  useEffect(() => {
    const goOffline = () => dispatch({ type: 'GO_OFFLINE' });
    const goOnline = () =>
      dispatch({ type: 'GO_ONLINE', hasPendingChanges: hasPendingRef.current });

    window.addEventListener('offline', goOffline);
    window.addEventListener('online', goOnline);

    // 初始状态检查
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      dispatch({ type: 'GO_OFFLINE' });
    }

    return () => {
      window.removeEventListener('offline', goOffline);
      window.removeEventListener('online', goOnline);
    };
  }, []);

  // ─── 离页提示 ───
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasPendingRef.current || state.status === 'saving' || state.status === 'retrying') {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [state.status]);

  // ─── notifyEdit：debounce 触发保存 ───
  const notifyEdit = useCallback(
    (payload: SavePayload) => {
      latestRef.current = payload;
      hasPendingRef.current = true;
      dispatch({ type: 'EDIT' });

      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        void doSave();
      }, debounceMs);
    },
    [doSave, debounceMs]
  );

  // ─── flushSave：立即保存（跳过 debounce）───
  const flushSave = useCallback(async () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    // 如果正在保存，等待当前完成后继续
    if (inflightRef.current) return;
    await doSave();
  }, [doSave]);

  // ─── 冲突解决 ───
  const resolveConflictLoadServer = useCallback((serverVersion: number) => {
    baseVersionRef.current = serverVersion;
    hasPendingRef.current = false;
    latestRef.current = null;
    dispatch({ type: 'RESOLVE_CONFLICT_LOAD_SERVER', version: serverVersion });
  }, []);

  const resolveConflictKeepLocal = useCallback(
    (serverVersion: number) => {
      baseVersionRef.current = serverVersion;
      dispatch({ type: 'RESOLVE_CONFLICT_KEEP_LOCAL', newBaseVersion: serverVersion });
    },
    []
  );

  return {
    state,
    notifyEdit,
    flushSave,
    resolveConflictLoadServer,
    resolveConflictKeepLocal,
  };
}

// ─── 辅助类型与函数 ───

export class ConflictError extends Error {
  constructor(public currentVersion: number) {
    super('VERSION_CONFLICT');
    this.name = 'ConflictError';
  }
}

function isConflictError(err: unknown): err is ConflictError {
  return err instanceof ConflictError || (err as { name?: string })?.name === 'ConflictError';
}

function isPermanentError(err: unknown): boolean {
  const status = (err as { status?: number; response?: { status?: number } })?.status ??
    (err as { response?: { status?: number } })?.response?.status;
  if (status === undefined) return false;
  return status === 401 || status === 403 || status === 422;
}

function getErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  return '保存失败';
}

function objectsEqual(a: SavePayload, b: SavePayload): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}
