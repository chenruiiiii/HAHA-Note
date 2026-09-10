import { VersionConflictError, NotFoundError } from '@/server/dal/errors';
import { upsertDocumentForUser, findDocumentById } from '@/server/dal/documents';
import { requireUser } from '@/server/dal/require-user';
import { dalErrorResponse, privateJson } from '@/server/http/private-json';
import { DocumentDetail } from '@/models/docs';

export interface DocsDetailBody {
  title?: string;
  content_html?: string;
  repository_id?: string;
  author?: string;
  summary?: string;
  baseVersion?: number;
  persist?: boolean;
}

/**
 * docs-detail / docs-summary 共用的“读取当前用户 + upsert 文档”处理器。
 *
 * 契约冻结点：创建时缺 repository_id 返回 code 400；知识库不匹配返回 HTTP 409
 * 且 data 为服务端最新文档；成功返回保存后的文档 DTO。
 */
export async function upsertDocsDetailForRequest(
  request: Request,
  docsId: string,
  body: DocsDetailBody,
  messages: { create: string; save: string }
): Promise<Response> {
  try {
    const user = await requireUser(request);
    const existed = (await findDocumentById(docsId, user.userId)) !== null;
    const data = await upsertDocumentForUser(docsId, user.userId, {
      title: body.title,
      content_html: body.content_html,
      summary: body.summary,
      repository_id: body.repository_id,
      baseVersion: typeof body.baseVersion === 'number' ? body.baseVersion : undefined,
    });

    return privateJson({
      code: 200,
      data: data as unknown as DocumentDetail,
      message: existed ? messages.save : messages.create,
    });
  } catch (error) {
    if (error instanceof VersionConflictError) {
      return privateJson(
        {
          code: 409,
          data: error.latest as DocumentDetail,
          message: error.message,
        },
        { status: 409 }
      );
    }

    if (error instanceof NotFoundError) {
      // 历史契约：新建文档缺 repository_id 属于参数错误（code 400）
      return privateJson({ code: 400, data: null, message: error.message }, { status: 400 });
    }

    const response = dalErrorResponse(error);
    return response ?? privateJson({ code: 500, data: null, message: 'error' }, { status: 500 });
  }
}
