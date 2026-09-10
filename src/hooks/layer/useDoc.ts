import { useRouter } from 'next/navigation';

export default function useDoc() {
  const router = useRouter();

  /**
   * 跳转文档详情。
   *
   * 导航必须使用同源相对路径：NEXT_PUBLIC_* 在构建期内联，生产环境未配置时
   * 会把 undefined 拼进 URL（线上 /undefined/public-note/... 404 的根因）。
   *
   * @param isPublic - 是否公开文档（逛逛文章走 public-note，工作区文档走知识库详情）。
   * @param id - 公开路径为文章 id；私有路径为文档 id。
   * @param repoId - 私有路径必传，文档所属知识库 id。
   */
  const handleToDetail = (isPublic: boolean, id: string, repoId?: string) => {
    if (isPublic) {
      // 公开文档
      window.open(`/public-note/${id}`, '_blank', 'noopener,noreferrer');
    } else {
      // 私有知识库文档
      router.push(`/repo-detail/${repoId}/${id}`);
    }
  };
  return {
    handleToDetail,
  };
}
