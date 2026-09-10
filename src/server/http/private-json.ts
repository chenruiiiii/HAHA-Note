import { NextResponse } from 'next/server';
import { ConflictError, NotFoundError } from '@/server/dal/errors';
import { UnauthorizedError } from '@/server/dal/require-user';

export function privateJson(body: unknown, init?: ResponseInit): NextResponse {
  const response = NextResponse.json(body, init);
  response.headers.set('Cache-Control', 'private, no-store');
  response.headers.set('Pragma', 'no-cache');
  return response;
}

export function dalErrorResponse(error: unknown): NextResponse | null {
  if (error instanceof UnauthorizedError) {
    return privateJson(
      { code: 401, data: null, message: error.message },
      { status: 401 }
    );
  }

  if (error instanceof NotFoundError) {
    return privateJson(
      { code: 404, data: null, message: error.message },
      { status: 404 }
    );
  }

  if (error instanceof ConflictError) {
    return privateJson(
      { code: 409, data: null, message: error.message },
      { status: 409 }
    );
  }

  return null;
}
