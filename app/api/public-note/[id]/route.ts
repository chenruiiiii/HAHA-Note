import { NextResponse } from 'next/server';
import { publicNoteMockMap } from '@/constants/config.ts/mock';

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const detail = publicNoteMockMap[id];

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
