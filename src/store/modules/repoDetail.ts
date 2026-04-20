import { RepoDetailType } from '@/components/layout/Repository/types';
import { normalizeRepoDetailData, syncRepoCollectStatus } from '@/services/repo-detail';
import { PayloadAction, createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import type { RootState } from '@/store';

export const REPO_DETAIL_CACHE_TTL = 24 * 60 * 60 * 1000;

export interface RepoDetailCacheItem {
  data: RepoDetailType;
  timestamp: number;
}

interface RepoDetailState {
  cacheById: Record<string, RepoDetailCacheItem>;
  dirtyCollectById: Record<string, boolean>;
  syncingCollectById: Record<string, boolean>;
}

const initialState: RepoDetailState = {
  cacheById: {},
  dirtyCollectById: {},
  syncingCollectById: {},
};

export const syncRepoDetailCollectAction = createAsyncThunk<
  { id: string; data: RepoDetailType },
  { id: string; keepalive?: boolean },
  { state: RootState }
>('repoDetail/syncCollect', async ({ id, keepalive }, { getState, rejectWithValue }) => {
  const repoDetailCache = getState().repoDetail.cacheById[id];

  if (!repoDetailCache) {
    return rejectWithValue('未找到知识库缓存');
  }

  const response = await syncRepoCollectStatus(id, repoDetailCache.data.isCollect, { keepalive });

  if (response.code !== 200) {
    return rejectWithValue(response.message || '更新收藏状态失败');
  }

  return {
    id,
    data: normalizeRepoDetailData(response.data),
  };
});

const repoDetailStore = createSlice({
  name: 'repoDetail',
  initialState,
  reducers: {
    setRepoDetailCacheAction(
      state,
      { payload }: PayloadAction<{ id: string; data: RepoDetailType; timestamp?: number }>
    ) {
      state.cacheById[payload.id] = {
        data: payload.data,
        timestamp: payload.timestamp ?? Date.now(),
      };
      delete state.dirtyCollectById[payload.id];
    },
    removeRepoDetailCacheAction(state, { payload }: PayloadAction<string>) {
      delete state.cacheById[payload];
      delete state.dirtyCollectById[payload];
      delete state.syncingCollectById[payload];
    },
    clearRepoDetailCacheAction(state) {
      state.cacheById = {};
      state.dirtyCollectById = {};
      state.syncingCollectById = {};
    },
    upsertRepoDetailDocAction(
      state,
      { payload }: PayloadAction<{ repoId: string; docsId: string; docsName: string }>
    ) {
      const targetCache = state.cacheById[payload.repoId];

      if (!targetCache) return;

      const targetDoc = targetCache.data.docs_list.find((item) => item.docs_id === payload.docsId);

      if (targetDoc) {
        targetDoc.docs_name = payload.docsName;
      } else {
        targetCache.data.docs_list.unshift({
          docs_id: payload.docsId,
          docs_name: payload.docsName,
        });
      }

      targetCache.timestamp = Date.now();
    },
    toggleRepoDetailCollectOptimisticAction(state, { payload }: PayloadAction<string>) {
      const targetCache = state.cacheById[payload];

      if (!targetCache) return;

      targetCache.data.isCollect = !targetCache.data.isCollect;
      targetCache.timestamp = Date.now();
      state.dirtyCollectById[payload] = true;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(syncRepoDetailCollectAction.pending, (state, action) => {
        state.syncingCollectById[action.meta.arg.id] = true;
      })
      .addCase(syncRepoDetailCollectAction.fulfilled, (state, action) => {
        const { id, data } = action.payload;
        state.cacheById[id] = {
          data,
          timestamp: Date.now(),
        };
        delete state.dirtyCollectById[id];
        delete state.syncingCollectById[id];
      })
      .addCase(syncRepoDetailCollectAction.rejected, (state, action) => {
        delete state.syncingCollectById[action.meta.arg.id];
      });
  },
});

export const {
  setRepoDetailCacheAction,
  removeRepoDetailCacheAction,
  clearRepoDetailCacheAction,
  upsertRepoDetailDocAction,
  toggleRepoDetailCollectOptimisticAction,
} = repoDetailStore.actions;

export default repoDetailStore.reducer;
