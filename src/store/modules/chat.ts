import { createSlice } from '@reduxjs/toolkit';

interface IState {
  isPosting: boolean;
  requestStatus: 'idle' | 'submitted' | 'streaming' | 'retrying' | 'ready' | 'success' | 'aborted' | 'error';
  lastError: string;
  retryCount: number;
}

const initialState: IState = {
  isPosting: false, // 是否正在发送中 --> 控制发送按钮显示
  requestStatus: 'idle',
  lastError: '',
  retryCount: 0,
};

const ChatStore = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    setPostingAction(state, { payload }) {
      // 更改isPosting状态
      state.isPosting = payload;
    },
    setChatRequestStateAction(state, { payload }) {
      if (typeof payload.isPosting === 'boolean') {
        state.isPosting = payload.isPosting;
      }
      if (payload.requestStatus) {
        state.requestStatus = payload.requestStatus;
      }
      if (typeof payload.retryCount === 'number') {
        state.retryCount = payload.retryCount;
      }
      if (typeof payload.lastError === 'string') {
        state.lastError = payload.lastError;
      }
    },
    setChatErrorAction(state, { payload }) {
      state.requestStatus = 'error';
      state.isPosting = false;
      state.lastError = payload.error || '请求失败';
    },
    resetChatRequestStateAction(state) {
      state.isPosting = false;
      state.requestStatus = 'idle';
      state.lastError = '';
      state.retryCount = 0;
    },
  },
});

export const {
  setPostingAction,
  setChatRequestStateAction,
  setChatErrorAction,
  resetChatRequestStateAction,
} = ChatStore.actions;

export default ChatStore.reducer;
