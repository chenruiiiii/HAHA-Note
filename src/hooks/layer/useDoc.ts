import { useRouter } from 'next/navigation';

export default function useDoc() {
  const router = useRouter();
  const handleToDetail = (isPublic: boolean, id: string, repoId?: string) => {
    if (isPublic) {
      // 公开文档
      window.open(`${process.env.NEXT_PUBLIC_BASE_URL}/public-note/${id}`, '_blank');
    } else {
      // 私有知识库文档
      router.push(`/repo-detail/${repoId}/${id}`);
    }
  };
  return {
    handleToDetail,
  };
}
