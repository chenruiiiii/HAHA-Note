'use client';

import { useEffect, useState } from 'react';
import http from '@/lib/http';
import type { ResponseData } from '@/types/response';

export interface AiModelOption {
  id: string;
  name: string;
}

interface ModelCacheEntry {
  data: AiModelOption[];
  fetchedAt: number;
}

const MODEL_CACHE_TTL_MS = 5 * 60 * 1000;

let modelCache: ModelCacheEntry | null = null;
let inFlightRequest: Promise<AiModelOption[]> | null = null;

function isFresh(entry: ModelCacheEntry | null) {
  return Boolean(entry && Date.now() - entry.fetchedAt < MODEL_CACHE_TTL_MS);
}

async function fetchAvailableModels() {
  if (isFresh(modelCache)) {
    return modelCache!.data;
  }

  if (inFlightRequest) {
    return inFlightRequest;
  }

  inFlightRequest = (async () => {
    const response = await http.get<ResponseData<AiModelOption[]>>('/ai-models');

    if (response.code !== 200 || !Array.isArray(response.data)) {
      throw new Error(response.message || '模型列表加载失败');
    }

    const data = response.data.filter(
      (item): item is AiModelOption =>
        Boolean(item && typeof item.id === 'string' && typeof item.name === 'string')
    );

    modelCache = { data, fetchedAt: Date.now() };
    return data;
  })().finally(() => {
    inFlightRequest = null;
  });

  return inFlightRequest;
}

/**
 * 可调用模型列表：5 分钟内复用模块级缓存，并发挂载共享同一个请求。
 * 失败时返回空列表，由输入框回退到服务端默认模型。
 */
export function useAvailableModels() {
  const [modelOptions, setModelOptions] = useState<AiModelOption[]>(() => modelCache?.data ?? []);
  const [isLoading, setIsLoading] = useState(() => !isFresh(modelCache));

  useEffect(() => {
    let active = true;

    void fetchAvailableModels()
      .then((data) => {
        if (active) {
          setModelOptions(data);
        }
      })
      .catch(() => {
        if (active) {
          setModelOptions([]);
        }
      })
      .finally(() => {
        if (active) {
          setIsLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  return { modelOptions, isLoading };
}
