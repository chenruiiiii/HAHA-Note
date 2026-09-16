import { NextResponse } from 'next/server';
import { listAllowedModels } from '@/lib/ai/provider';

/**
 * 模型列表来自环境变量白名单，进程内恒定不变，但每次请求重建数组/读取 env
 * 纯属浪费。这里做进程内短 TTL 缓存：跨请求复用同一结果，无需额外依赖。
 * TTL 60s 仅为防御性设计（配合热更新/运行时注入），不影响正确性。
 */
const CACHE_TTL_MS = 60_000;

let cachedAt = 0;
let cachedPayload: unknown = null;

type ModelsPayload = {
  code: number;
  data: Array<{ id: string; name: string }>;
  message: string;
};

/**
 * 返回当前白名单模型列表，供前端模型下拉使用。
 *
 * 只暴露模型 id/name，绝不返回 apiKey / baseURL 等信息。
 *
 * @returns JSON `{ code, data: [{ id, name }], message }`。
 */
export async function GET() {
  const now = Date.now();

  if (!cachedPayload || now - cachedAt > CACHE_TTL_MS) {
    cachedPayload = {
      code: 200,
      data: listAllowedModels(),
      message: 'ok',
    };
    cachedAt = now;
  }

  return NextResponse.json(cachedPayload as ModelsPayload);
}
