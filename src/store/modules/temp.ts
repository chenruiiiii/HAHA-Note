import { createSlice } from '@reduxjs/toolkit';

interface IState {
  value: string; // 临时存储内容
}

const initialState: IState = {
  value: '',
};

const TempStore = createSlice({
  name: 'temp',
  initialState,
  reducers: {
    setTempValueAction: (state, { payload }) => {
      state.value = payload;
      console.log('test-test', payload, 'state.value', state.value);
    },
  },
});

export default TempStore.reducer;

export const { setTempValueAction } = TempStore.actions;
