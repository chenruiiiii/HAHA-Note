export class UnauthorizedError extends Error {
  constructor(message = '未登录或登录已过期') {
    super(message);
    this.name = 'UnauthorizedError';
  }
}

export class ForbiddenError extends Error {
  constructor(message = '没有权限访问该资源') {
    super(message);
    this.name = 'ForbiddenError';
  }
}

export class NotFoundError extends Error {
  constructor(message = '资源不存在') {
    super(message);
    this.name = 'NotFoundError';
  }
}

export class VersionConflictError<T = unknown> extends Error {
  latest: T;

  constructor(latest: T, message = '文档版本冲突，请刷新后重试') {
    super(message);
    this.name = 'VersionConflictError';
    this.latest = latest;
  }
}

// Prisma 唯一约束冲突（P2002），用于把并发写竞争映射为 409
export function isUniqueConstraintError(error: unknown): boolean {
  return (
    typeof error === 'object' && error !== null && (error as { code?: unknown }).code === 'P2002'
  );
}
