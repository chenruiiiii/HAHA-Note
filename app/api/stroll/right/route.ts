// app/api/stroll/right/route.ts
import { NextResponse } from 'next/server';

/**
 * 获取逛逛右侧推荐接口的健康占位响应。
 *
 * @returns `{ ok: true }` JSON 响应。
 */
export async function GET() {
  return NextResponse.json({ ok: true });
}
