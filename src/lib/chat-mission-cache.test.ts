import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ListItem } from '@/models/ai-mission';
import {
  clearChatMissionCache,
  getCachedChatMissionList,
  invalidateChatMissionCache,
  loadChatMissionList,
  removeChatMissionFromCache,
} from './chat-mission-cache';

const makeItem = (id: string): ListItem => ({
  _id: id,
  title: `对话 ${id}`,
  docs_id: id,
});

describe('chat mission cache', () => {
  beforeEach(() => {
    clearChatMissionCache();
  });

  it('uses a fresh cache without requesting again', async () => {
    const loader = vi.fn(async () => [makeItem('one')]);

    await loadChatMissionList('recent', loader);
    await loadChatMissionList('recent', loader);

    expect(loader).toHaveBeenCalledTimes(1);
    expect(getCachedChatMissionList('recent')).toEqual([makeItem('one')]);
  });

  it('requests again after invalidation', async () => {
    let version = 0;
    const loader = vi.fn(async () => [makeItem(String(version))]);

    await loadChatMissionList('recent', loader);
    version = 1;
    invalidateChatMissionCache();
    await loadChatMissionList('recent', loader);

    expect(loader).toHaveBeenCalledTimes(2);
    expect(getCachedChatMissionList('recent')).toEqual([makeItem('1')]);
  });

  it('deduplicates concurrent requests for the same group', async () => {
    let resolveRequest: ((items: ListItem[]) => void) | undefined;
    const request = new Promise<ListItem[]>((resolve) => {
      resolveRequest = resolve;
    });
    const loader = vi.fn(() => request);

    const first = loadChatMissionList('recent', loader);
    const second = loadChatMissionList('recent', loader);

    expect(loader).toHaveBeenCalledTimes(1);
    resolveRequest?.([makeItem('one')]);

    await expect(first).resolves.toEqual([makeItem('one')]);
    await expect(second).resolves.toEqual([makeItem('one')]);
  });

  it('removes a deleted conversation from every cached group', async () => {
    await loadChatMissionList('recent', async () => [makeItem('keep'), makeItem('remove')]);
    await loadChatMissionList('favorite', async () => [makeItem('remove')]);

    removeChatMissionFromCache('remove');

    expect(getCachedChatMissionList('recent')).toEqual([makeItem('keep')]);
    expect(getCachedChatMissionList('favorite')).toEqual([]);
  });

  it('does not let an invalidated request overwrite newer cache state', async () => {
    let resolveOldRequest: ((items: ListItem[]) => void) | undefined;
    const oldRequest = new Promise<ListItem[]>((resolve) => {
      resolveOldRequest = resolve;
    });

    const loadingOld = loadChatMissionList('recent', () => oldRequest);
    invalidateChatMissionCache();
    await loadChatMissionList('recent', async () => [makeItem('new')]);

    resolveOldRequest?.([makeItem('old')]);
    await loadingOld;

    expect(getCachedChatMissionList('recent')).toEqual([makeItem('new')]);
  });
});
