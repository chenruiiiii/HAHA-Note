'use client';

import HAError from '@/components/common/HAError';
import HALoading from '@/components/common/HALoading';
import PublicNote from '@/components/layout/PublicNote';
import { getPublicNoteDetail } from '@/services/public-note/client';
import { PublicNoteDetail } from '@/types/public-note';
import { use, useEffect, useState } from 'react';

interface PublicNoteContentProps {
  params: Promise<{ id: string }>;
}

function PublicNoteContent({ params }: PublicNoteContentProps) {
  const { id } = use(params);
  const [detail, setDetail] = useState<PublicNoteDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadDetail() {
      setLoading(true);
      setHasError(false);

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

    loadDetail();

    return () => {
      cancelled = true;
    };
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
