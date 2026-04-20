import { repositorySlice } from './modules/repository';
import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';
import TempReducer from './modules/temp';
import ChatReducer from './modules/chat';
import RepoDetailReducer from './modules/repoDetail';
import { configureStore } from '@reduxjs/toolkit';
import { userHistorySlice } from './modules/user_history';

export const store = configureStore({
  reducer: {
    temp: TempReducer,
    chat: ChatReducer,
    repoDetail: RepoDetailReducer,
    [userHistorySlice.reducerPath]: userHistorySlice.reducer,
    [repositorySlice.reducerPath]: repositorySlice.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(userHistorySlice.middleware, repositorySlice.middleware),
});

type GetStateFnType = typeof store.getState;
export type RootState = ReturnType<GetStateFnType>;
export type DispatchType = typeof store.dispatch;

// 规范化redux的dispatch和selector
export const useAppDispatch = useDispatch.withTypes<DispatchType>();
export const useAppSelector = useSelector.withTypes<RootState>();
export const useAppStore: TypedUseSelectorHook<RootState> = useSelector;

export default store;
