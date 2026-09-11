import { configureStore } from '@reduxjs/toolkit';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { DispatchType } from '@/store';
import { invalidateDocumentLists } from '@/store/invalidate';
import { repositorySlice } from '@/store/modules/repository';
import { userHistorySlice } from '@/store/modules/user_history';

const fetchMock = vi.fn(
  async () =>
    new Response('[]', {
      status: 200,
      headers: { 'content-type': 'application/json' },
    })
);

/**
 * Node 的 undici `Request` 拒绝相对 URL，而两个 slice 的 baseUrl 是相对路径
 * （浏览器里正常）。这里用最小 shim 顶替，只保留 fetchBaseQuery 读取的字段。
 */
class RelativeRequest {
  url: string;
  method: string;
  signal?: AbortSignal;

  constructor(input: string, init?: RequestInit) {
    this.url = typeof input === 'string' ? input : String(input);
    this.method = init?.method ?? 'GET';
    this.signal = init?.signal ?? undefined;
  }
}

// 只挂两个 API slice 的最小 store；dispatch 结构与 app store 兼容，故断言时收窄类型
function createTestStore() {
  return configureStore({
    reducer: {
      [userHistorySlice.reducerPath]: userHistorySlice.reducer,
      [repositorySlice.reducerPath]: repositorySlice.reducer,
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware().concat(userHistorySlice.middleware, repositorySlice.middleware),
  });
}

type TestStore = ReturnType<typeof createTestStore>;

function mountHomeLists(store: TestStore) {
  return [
    store.dispatch(repositorySlice.endpoints.getRepositoryList.initiate()),
    store.dispatch(userHistorySlice.endpoints.getEditedList.initiate({ type: '编辑过' })),
    store.dispatch(userHistorySlice.endpoints.getEditedList.initiate({ type: '浏览过' })),
  ];
}

const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

beforeEach(() => {
  fetchMock.mockClear();
  vi.stubGlobal('fetch', fetchMock);
  vi.stubGlobal('Request', RelativeRequest);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('invalidateDocumentLists', () => {
  it('列表挂载中：失效后立即重新请求（首页 / 新建文档弹窗场景）', async () => {
    const store = createTestStore();
    const subscriptions = mountHomeLists(store);
    await flush();
    expect(fetchMock.mock.calls.length).toBe(3);

    invalidateDocumentLists(store.dispatch as DispatchType);
    await flush();

    expect(fetchMock.mock.calls.length).toBe(6);
    subscriptions.forEach((subscription) => subscription.unsubscribe());
  });

  it('列表已卸载：失效后重新挂载会重新请求（从文档页返回首页）', async () => {
    const store = createTestStore();
    mountHomeLists(store).forEach((subscription) => subscription.unsubscribe());
    await flush();

    invalidateDocumentLists(store.dispatch as DispatchType);
    await flush();

    const callsBefore = fetchMock.mock.calls.length;
    const subscriptions = mountHomeLists(store);
    await flush();

    expect(fetchMock.mock.calls.length).toBeGreaterThan(callsBefore);
    subscriptions.forEach((subscription) => subscription.unsubscribe());
  });
});
