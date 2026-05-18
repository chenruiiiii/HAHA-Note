import { NextResponse } from 'next/server';
import { getPublicNoteDetailById } from '@/services/public-note';

/**
 * 获取指定公开笔记详情。
 *
 * @param _request - 请求对象，当前接口未读取请求内容。
 * @param params - Next.js 动态路由参数，`id` 为公开笔记 ID。
 * @returns 公开笔记详情 JSON 响应；笔记不存在时返回 404。
 */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const detail = await getPublicNoteDetailById(id);

  if (!detail) {
    return NextResponse.json(
      {
        code: 404,
        data: null,
        message: '公开笔记不存在',
      },
      { status: 404 }
    );
  }

  return NextResponse.json({
    code: 200,
    data: detail,
    message: 'success',
  });
}
