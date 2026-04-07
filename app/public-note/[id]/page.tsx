import React from 'react';
import PublicNote from '@/components/layout/PublicNote';
import { notFound } from 'next/navigation';
import { getPublicNoteDetailById } from '@/services/public-note';

async function PublicPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const detail = await getPublicNoteDetailById(id);

  if (!detail) {
    notFound();
  }

  return <PublicNote detail={detail} />;
}

export default PublicPage;
