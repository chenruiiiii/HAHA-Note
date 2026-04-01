'use client';

import React from 'react';
import MDEditor from '@uiw/react-md-editor';
import styles from './style.module.scss';
import { RecommendDetailType } from '../../types/recommend';

interface FileDetailProps {
  detail: RecommendDetailType;
}

const FileDetail = ({ detail }: FileDetailProps) => {
  const {
    source,
    title_html,
    description_html,
    content_html,
    like_count,
    comment_count,
    word_count,
  } = detail;
  const isYuqueFeatured = source.platform === 'yuque' && detail.quality_level === 'featured';
  const outlineItems = Array.from(
    content_html.matchAll(/<h([1-6])(?:[^>]*id=["']([^"']+)["'])?[^>]*>(.*?)<\/h\1>/gi)
  ).map((match, index) => {
    const id = match[2] || `section-${index + 1}`;
    const text = match[3].replace(/<[^>]+>/g, '').trim();
    return { id, text };
  });

  return (
    <div className={styles['file-detail']}>
      <header className={styles['topbar']}>
        <div className={styles['topbar-left']}>
          <div
            className={styles['source-avatar']}
            aria-hidden="true"
            style={source.avatar ? { backgroundImage: `url(${source.avatar})` } : undefined}
          >
            {!source.avatar && <span>{source.title[0]}</span>}
          </div>
          <span className={styles['topbar-title']}>{source.title}</span>
        </div>
      </header>

      <div className={styles['detail-layout']}>
        <main className={styles['article-panel']}>
          <article className={styles['article']}>
            <div className={styles['article-head']}>
              <div className={styles['title-row']}>
                <div
                  className={styles['article-title']}
                  dangerouslySetInnerHTML={{ __html: title_html }}
                />
                {isYuqueFeatured && <span className={styles['featured-badge']}>语雀精选</span>}
              </div>
              <div
                className={styles['article-desc']}
                dangerouslySetInnerHTML={{ __html: description_html }}
              />
            </div>

            <div className={styles['article-body']} data-color-mode="light">
              <MDEditor.Markdown source={content_html} className={styles['markdown-preview']} />
            </div>
          </article>
        </main>

        <aside className={styles['outline-panel']}>
          <div className={styles['outline-card']}>
            <div className={styles['outline-header']}>大纲</div>
            <nav className={styles['outline-nav']} aria-label="文章大纲">
              {outlineItems.map((section, index) => (
                <a
                  key={`${section.id}-${section.text}`}
                  href={`#${section.id}`}
                  className={[
                    styles['outline-link'],
                    index === 0 ? styles['outline-link-active'] : '',
                  ].join(' ')}
                >
                  {section.text}
                </a>
              ))}
            </nav>
          </div>
        </aside>
      </div>

      <div className={styles['floating-feedback']}>
        <button type="button" className={styles['feedback-action']} aria-label="点赞">
          <span className={styles['feedback-count']}>{like_count}</span>
          <i className="iconfont icon-dianzan" />
        </button>
        <button type="button" className={styles['feedback-action']} aria-label="评论">
          <span className={styles['feedback-count']}>{comment_count}</span>
          <i className="iconfont icon-pinglun" />
        </button>
      </div>

      <div className={styles['word-count']}>{word_count}字</div>
    </div>
  );
};

export default FileDetail;
