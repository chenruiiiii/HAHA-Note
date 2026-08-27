import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '@/store';

interface ChatSessionState {
  isPosting: boolean;
  requestStatus:
    | 'idle'
    | 'submitted'
    | 'streaming'
    | 'retrying'
    | 'ready'
    | 'success'
    | 'aborted'
    | 'error';
  lastError: string;
  retryCount: number;
}

interface IState {
  /** 每个会话独立的状态，key 为 chatId，避免多会话互相污染 */
  byId: Record<string, ChatSessionState>;
  /** 当前激活的会话 id（用于跨页导航时状态衔接） */
  currentChatId: string | null;
}

const createInitialSessionState = (): ChatSessionState => ({
  isPosting: false, // 是否正在发送中 --> 控制发送按钮显示
  requestStatus: 'idle',
  lastError: '',
  retryCount: 0,
});

const initialState: IState = {
  byId: {},
  currentChatId: null,
};

const ChatStore = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    /** 切换会话级 isPosting 状态（需携带 chatId） */
    setPostingAction(
      state,
      { payload }: PayloadAction<{ chatId: string; isPosting: boolean }>
    ) {
      const session = (state.byId[payload.chatId] ??= createInitialSessionState());
      session.isPosting = payload.isPosting;
    },
    /** 会话级请求状态写入（唯一数据源，所有写入方都需携带 chatId） */
    setChatRequestStateAction(
      state,
      { payload }: PayloadAction<{ chatId: string } & Partial<ChatSessionState>>
    ) {
      const { chatId, ...rest } = payload;
      const session = (state.byId[chatId] ??= createInitialSessionState());

      if (typeof rest.isPosting === 'boolean') {
        session.isPosting = rest.isPosting;
      }
      if (rest.requestStatus) {
        session.requestStatus = rest.requestStatus;
      }
      if (typeof rest.retryCount === 'number') {
        session.retryCount = rest.retryCount;
      }
      if (typeof rest.lastError === 'string') {
        session.lastError = rest.lastError;
      }
    },
    /** 会话级错误状态写入（需携带 chatId） */
    setChatErrorAction(state, { payload }: PayloadAction<{ chatId: string; error: string }>) {
      const session = (state.byId[payload.chatId] ??= createInitialSessionState());
      session.requestStatus = 'error';
      session.isPosting = false;
      session.lastError = payload.error || '请求失败';
    },
    /** 只删除当前 chatId 对应的会话状态，不全局 reset 整个 chat 模块 */
    resetChatRequestStateAction(state, { payload }: PayloadAction<{ chatId: string }>) {
      delete state.byId[payload.chatId];
      if (state.currentChatId === payload.chatId) {
        state.currentChatId = null;
      }
    },
    setCurrentChatIdAction(state, { payload }: PayloadAction<string | null>) {
      state.currentChatId = payload;
    },
  },
});

export const {
  setPostingAction,
  setChatRequestStateAction,
  setChatErrorAction,
  resetChatRequestStateAction,
  setCurrentChatIdAction,
} = ChatStore.actions;

/** 按 chatId 读取会话状态；会话不存在时返回默认状态，避免调用方空指针 */
export const selectChatState = (state: RootState, chatId: string): ChatSessionState =>
  state.chat.byId[chatId] ?? createInitialSessionState();

/** 当前激活会话 id */
export const selectCurrentChatId = (state: RootState): string | null => state.chat.currentChatId;

export default ChatStore.reducer;
