import type { DispatchType } from '@/store';
import { repositorySlice } from '@/store/modules/repository';
import { userHistorySlice } from '@/store/modules/user_history';

/**
 * 文档新建 / 保存后刷新首页依赖的列表缓存。
 *
 * 文档保存走的是 `src/services/docs-detail.ts` 里的普通 axios 请求，不是 RTK Query
 * mutation，不会自动触发失效；不显式 invalidate 的话，「知识库列表」（内含 docs_list）
 * 与「最近编辑 / 最近浏览」都会一直停留在旧数据上。
 */
export function invalidateDocumentLists(dispatch: DispatchType): void {
  dispatch(repositorySlice.util.invalidateTags(['repository']));
  dispatch(userHistorySlice.util.invalidateTags(['edited', 'browsed']));
}
