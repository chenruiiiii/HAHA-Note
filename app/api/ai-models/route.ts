import { NextResponse } from 'next/server';
import { listAllowedModels } from '@/lib/ai/provider';

/**
 * 返回当前白名单模型列表，供前端模型下拉使用。
 *
 * 只暴露模型 id/name，绝不返回 apiKey / baseURL 等信息。
 *
 * @returns JSON `{ code, data: [{ id, name }], message }`。
 */
export async function GET() {
  return NextResponse.json({
    code: 200,
    data: listAllowedModels(),
    message: 'ok',
  });
}