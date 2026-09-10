'use client';

import HAError from '@/components/common/HAError';
import HALoading from '@/components/common/HALoading';
import PublicNote from '@/components/layout/PublicNote';
import { getPublicNoteDetail } from '@/services/public-note/client';
import { PublicNoteDetail } from '@/types/public-note';
import { useEffect, useState } from 'react';

interface PublicNoteContentProps {
  id: string;
  /** 服务端首屏已解析的详情，避免客户端重复首屏加载。 */
  initialDetail: PublicNoteDetail;
}

function PublicNoteContent({ id, initialDetail }: PublicNoteContentProps) {
  const [detail, setDetail] = useState<PublicNoteDetail | null>(initialDetail);
  const [loading, setLoading] = useState(false);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    // 服务端已提供首屏数据，跳过一次冗余请求；若后续需要刷新可再次拉取。
    let cancelled = false;

    async function loadDetail() {
      try {
        const response = await getPublicNoteDetail(id);

        if (!cancelled) {
          setDetail(response.data);
        }
      } catch (error) {
        console.error('load public note failed', error);

        if (!cancelled) {
          setHasError(true);
          setDetail(null);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    // 仅在初始数据缺失时回退到客户端加载。
    if (!detail) {
      setLoading(true);
      void loadDetail();
    }

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (loading) {
    return <HALoading type="simple" />;
  }

  if (hasError || !detail) {
    return <HAError />;
  }

  return <PublicNote detail={detail} />;
}

export default PublicNoteContent;