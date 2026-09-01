/**
 * 自动保存状态机纯函数 reducer。
 *
 * 状态流转图：
 *   saved ──EDIT──→ dirty ──SAVE_START──→ saving
 *   saving ──SAVE_SUCCESS──→ saved
 *   saving ──SAVE_TRANSIENT_ERROR──→ retrying ──RETRY──→ saving
 *   saving ──SAVE_PERMANENT_ERROR──→ error
 *   saving ──CONFLICT──→ conflict
 *   conflict ──RESOLVE_LOAD_SERVER──→ saved
 *   conflict ──RESOLVE_KEEP_LOCAL──→ dirty
 *   任意 ──GO_OFFLINE──→ offline
 *   offline ──GO_ONLINE(hasPending)──→ dirty / saved
 */

export type AutosaveStatus =
  | 'saved'
  | 'dirty'
  | 'saving'
  | 'error'
  | 'retrying'
  | 'conflict'
  | 'offline';

export interface AutosaveState {
  status: AutosaveStatus;
  /** 最后一次成功保存的服务端版本号。 */
  version: number;
  /** 409 冲突时服务端返回的当前版本号。 */
  conflictVersion: number | null;
  /** 瞬态错误重试次数（用于指数退避计算）。 */
  retryCount: number;
  /** 最后一次成功保存的时间戳（ms）。 */
  lastSavedAt: number | null;
  /** 错误/冲突提示消息。 */
  error: string | null;
}

export type AutosaveAction =
  | { type: 'EDIT' }
  | { type: 'SAVE_START' }
  | { type: 'SAVE_SUCCESS'; version: number }
  | { type: 'SAVE_TRANSIENT_ERROR'; message?: string }
  | { type: 'SAVE_PERMANENT_ERROR'; message: string }
  | { type: 'CONFLICT'; currentVersion: number }
  | { type: 'RETRY' }
  | { type: 'GO_OFFLINE' }
  | { type: 'GO_ONLINE'; hasPendingChanges: boolean }
  | { type: 'RESOLVE_CONFLICT_LOAD_SERVER'; version: number }
  | { type: 'RESOLVE_CONFLICT_KEEP_LOCAL'; newBaseVersion: number }
  | { type: 'RESET'; version: number };

export function initialAutosaveState(version: number): AutosaveState {
  return {
    status: 'saved',
    version,
    conflictVersion: null,
    retryCount: 0,
    lastSavedAt: null,
    error: null,
  };
}

export function autosaveReducer(
  state: AutosaveState,
  action: AutosaveAction
): AutosaveState {
  switch (action.type) {
    case 'EDIT': {
      // saving 期间编辑：保持 saving，latestRef 串行化处理新编辑
      // conflict 期间编辑：保持 conflict，用户必须先解决冲突
      // offline 期间编辑：保持 offline，待恢复在线后变 dirty
      if (state.status === 'saving' || state.status === 'conflict' || state.status === 'offline') {
        return state;
      }
      return { ...state, status: 'dirty', error: null };
    }

    case 'SAVE_START': {
      if (state.status !== 'dirty' && state.status !== 'retrying' && state.status !== 'error') {
        return state;
      }
      return { ...state, status: 'saving', error: null };
    }

    case 'SAVE_SUCCESS': {
      return {
        ...state,
        status: 'saved',
        version: action.version,
        conflictVersion: null,
        retryCount: 0,
        lastSavedAt: Date.now(),
        error: null,
      };
    }

    case 'SAVE_TRANSIENT_ERROR': {
      if (state.status !== 'saving') return state;
      return {
        ...state,
        status: 'retrying',
        retryCount: state.retryCount + 1,
        error: action.message ?? '网络异常，正在重试',
      };
    }

    case 'SAVE_PERMANENT_ERROR': {
      if (state.status !== 'saving') return state;
      return {
        ...state,
        status: 'error',
        error: action.message,
      };
    }

    case 'CONFLICT': {
      if (state.status !== 'saving') return state;
      return {
        ...state,
        status: 'conflict',
        conflictVersion: action.currentVersion,
        error: '文档已被他人更新，请处理冲突',
      };
    }

    case 'RETRY': {
      if (state.status !== 'retrying' && state.status !== 'error') return state;
      return { ...state, status: 'saving', error: null };
    }

    case 'GO_OFFLINE': {
      if (state.status === 'conflict') return state;
      return { ...state, status: 'offline', error: '网络已断开' };
    }

    case 'GO_ONLINE': {
      if (state.status !== 'offline') return state;
      return {
        ...state,
        status: action.hasPendingChanges ? 'dirty' : 'saved',
        error: null,
      };
    }

    case 'RESOLVE_CONFLICT_LOAD_SERVER': {
      if (state.status !== 'conflict') return state;
      return {
        ...state,
        status: 'saved',
        version: action.version,
        conflictVersion: null,
        error: null,
      };
    }

    case 'RESOLVE_CONFLICT_KEEP_LOCAL': {
      if (state.status !== 'conflict') return state;
      return {
        ...state,
        status: 'dirty',
        version: action.newBaseVersion,
        conflictVersion: null,
        error: null,
      };
    }

    case 'RESET': {
      return initialAutosaveState(action.version);
    }

    default:
      return state;
  }
}
