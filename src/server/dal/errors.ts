export class NotFoundError extends Error {
  constructor(message = '资源不存在') {
    super(message);
    this.name = 'NotFoundError';
  }
}

export class ConflictError extends Error {
  constructor(message = '请求与当前资源状态冲突') {
    super(message);
    this.name = 'ConflictError';
  }
}
