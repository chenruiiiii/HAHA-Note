import { createSlice } from '@reduxjs/toolkit';

interface IState {
  isPosting: boolean;
}

const initialState: IState = {
  isPosting: false, // 是否正在发送中 --> 控制发送按钮显示
};

const ChatStore = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    setPostingAction(state, { payload }) {
      // 更改isPosting状态
      state.isPosting = payload;
    },
  },
});

export const { setPostingAction } = ChatStore.actions;

export default ChatStore.reducer;
