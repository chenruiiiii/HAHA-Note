'use client';
import './style.scss';
import PublicNoteArticle from './components/PublicNoteArticle';
import { PublicNoteDetail } from '@/types/public-note';

interface PublicNoteProps {
  detail: PublicNoteDetail;
}

const PublicNote = ({ detail }: PublicNoteProps) => {
  return (
    <div className="public-note">
      <PublicNoteArticle detail={detail} />
    </div>
  );
};

export default PublicNote;
