import { NextResponse } from 'next/server';
import {
  ForbiddenError,
  NotFoundError,
  UnauthorizedError,
  VersionConflictError,
} from '@/server/dal/errors';

export function privateJson(body: unknown, init?: ResponseInit): NextResponse {
  const response = NextResponse.json(body, init);
  response.headers.set('Cache-Control', 'private, no-store');
  response.headers.set('Pragma', 'no-cache');
  return response;
}

export function dalErrorResponse(error: unknown): NextResponse | null {
  if (error instanceof UnauthorizedError) {
    return privateJson({ code: 401, data: null, message: error.message }, { status: 401 });
  }

  if (error instanceof ForbiddenError || error instanceof NotFoundError) {
    return privateJson({ code: 404, data: null, message: error.message }, { status: 404 });
  }

  if (error instanceof VersionConflictError) {
    return privateJson({ code: 409, data: error.latest, message: error.message }, { status: 409 });
  }

  return null;
}
