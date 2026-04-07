'use client';

import {
  LikeOutlined,
  EyeInvisibleOutlined,
  MessageOutlined,
  ReadOutlined,
  StarOutlined,
} from '@ant-design/icons';
import HABack from '@/components/common/HABack';
import { HAEditorPreview } from '@/components/common/HAEditor';
import { useRouter } from 'next/navigation';
import { PublicNoteDetail } from '@/types/public-note';
import styles from './style.module.scss';

interface PublicNoteArticleProps {
  detail: PublicNoteDetail;
}

const stripHtml = (value: string) => value.replace(/<[^>]+>/g, '').trim();

const PublicNoteArticle = ({ detail }: PublicNoteArticleProps) => {
  const router = useRouter();
  const previewTitle = stripHtml(detail.titleHtml) || detail.title;
  const previewContent = `
    <p>${detail.summaryHtml}</p>
    ${detail.contentHtml}
  `;

  const handleToHome = () => {
    router.push('/');
  };

  return (
    <div className="public-note__shell">
      <header className="public-note__topbar">
        <div className="public-note__topbar-left">
          <HABack onClick={() => handleToHome}>
            <div className={styles['back']}>返回</div>
          </HABack>
          <div className="public-note__source">
            <span className="public-note__source-title">{detail.sourceName}</span>
          </div>
        </div>
        <div className="public-note__topbar-right">
          <button type="button" className="public-note__topbar-action" aria-label="精选">
            <StarOutlined />
          </button>
        </div>
      </header>

      <div className="public-note__body">
        <main className="public-note__main">
          <div className="public-note__preview-wrap">
            {detail.sourceTag ? (
              <span className="public-note__badge">{detail.sourceTag}</span>
            ) : null}
            <HAEditorPreview title={previewTitle} content={previewContent} showOutline />
          </div>
        </main>
      </div>

      <div className="public-note__floating-actions">
        <button type="button" className="public-note__floating-button" aria-label="点赞">
          <span className="public-note__floating-count">{detail.likeCount}</span>
          <LikeOutlined />
        </button>
      </div>

      <div className="public-note__word-count">{detail.wordCount}字</div>
    </div>
  );
};

export default PublicNoteArticle;
