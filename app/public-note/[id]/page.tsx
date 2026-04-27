import React from 'react';
import PublicNote from '@/components/layout/PublicNote';
import { getPublicNoteDetailById } from '@/services/public-note';
import HAError from '@/components/common/HAError';

async function PublicPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const detail = await getPublicNoteDetailById(id);

  if (!detail) {
    return <HAError />;
  }

  return <PublicNote detail={detail} />;
}

export default PublicPage;
