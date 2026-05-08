import { Suspense } from 'react';
import HALoading from '@/components/common/HALoading';
import PublicNoteContent from './public-note-content';

interface PublicNotePageProps {
  params: Promise<{ id: string }>;
}

export default function PublicNotePage({ params }: PublicNotePageProps) {
  return (
    <Suspense fallback={<HALoading type="simple" />}>
      <PublicNoteContent params={params} />
    </Suspense>
  );
}
