import http from '@/lib/http';
import type { ResponseData } from '@/types/response';
import { DocumentDetail } from '@/models/docs';

// ─── legacy 兼容导出（旧调用方仍在使用）───

export const getDocsDetailData = async (docsId: string) => {
  return await http.get<ResponseData<DocumentDetail>>(`/docs-detail/${docsId}`);
};

export const updateDocsDetailData = async (
  docsId: string,
  payload: Pick<DocumentDetail, 'title' | 'content_html'> &
    Partial<Pick<DocumentDetail, 'repository_id' | 'author' | 'summary'>>
) => {
  return await http.post<ResponseData<DocumentDetail>>(`/docs-detail/${docsId}`, payload);
};

// ─── 版本化保存契约 ───

/** 版本化保存的请求载荷。 */
export interface VersionedSavePayload {
  baseVersion: number;
  content: unknown;
  title?: string;
  summary?: string;
  createRevision?: boolean;
  requestId?: string;
}

/** 版本化保存的响应 DTO。 */
export interface VersionedSaveDto {
  id: string;
  version: number;
  updatedAt: string;
  title: string;
  summary: string;
}

/** legacy 保存的请求载荷（兼容旧前端）。 */
export interface LegacySavePayload {
  content_html: string;
  title?: string;
  repository_id?: string;
  author?: string;
  summary?: string;
}

/** 409 冲突错误，携带服务端当前版本号。 */
export class ConflictError extends Error {
  constructor(public currentVersion: number) {
    super('VERSION_CONFLICT');
    this.name = 'ConflictError';
  }
}

/**
 * 版本化保存文档。返回新版本号；409 时抛出 ConflictError。
 */
export async function saveDocumentVersioned(
  docsId: string,
  payload: VersionedSavePayload
): Promise<VersionedSaveDto> {
  try {
    const res = await http.post<ResponseData<VersionedSaveDto & { legacy?: boolean }>>(
      `/docs-detail/${docsId}`,
      payload
    );

    // 409 冲突：服务端返回 code 为 'VERSION_CONFLICT' 字符串（不是标准 number code）
    if (res.code === ('VERSION_CONFLICT' as unknown as number) || res.code === 409) {
      const currentVersion =
        (res as unknown as { currentVersion?: number }).currentVersion ?? 0;
      throw new ConflictError(currentVersion);
    }

    if (res.code !== 200) {
      const err = new Error(res.message || '保存失败') as Error & { status?: number };
      err.status = typeof res.code === 'number' ? res.code : 500;
      throw err;
    }

    return res.data;
  } catch (err: unknown) {
    // 已经是 ConflictError 则直接抛出
    if (err instanceof ConflictError) throw err;

    // axios 错误中提取 HTTP 状态码
    const axiosErr = err as { response?: { status?: number; data?: unknown } };
    if (axiosErr.response?.status === 409) {
      const data = axiosErr.response.data as { currentVersion?: number } | undefined;
      throw new ConflictError(data?.currentVersion ?? 0);
    }
    if (axiosErr.response?.status) {
      const status = axiosErr.response.status;
      const e = new Error('保存失败') as Error & { status?: number };
      e.status = status;
      throw e;
    }
    throw err;
  }
}

/**
 * legacy 兼容保存（content_html）。用于未升级到版本化契约的旧页面。
 */
export async function saveDocumentLegacy(
  docsId: string,
  payload: LegacySavePayload
): Promise<VersionedSaveDto & { legacy: true }> {
  const res = await http.post<ResponseData<VersionedSaveDto & { legacy: true }>>(
    `/docs-detail/${docsId}`,
    payload
  );

  if (res.code !== 200) {
    throw new Error(res.message || '保存失败');
  }

  return res.data;
}
