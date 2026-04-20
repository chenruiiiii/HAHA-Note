'use client';

import { Tooltip } from 'antd';
import styles from './style.module.scss';
import { RepoDetailType } from '../../types';

interface RepoDetailHomeViewProps {
  repoDetail: RepoDetailType;
  onToggleCollect: () => void;
}

const RepoDetailHomeView = ({ repoDetail, onToggleCollect }: RepoDetailHomeViewProps) => {
  const { title, docs_list, avatar, repo_desc, isCollect } = repoDetail;
  const ownerAvatar = avatar?.[0];
  const safeDocsList = Array.isArray(docs_list) ? docs_list : [];

  return (
    <section className={styles['repo-detail-home']}>
      <div className={styles['repo-card']}>
        <header className={styles['hero-section']}>
          <div className={styles['hero-main']}>
            <div className={styles['hero-title-row']}>
              <h1 className={styles['repo-title']}>{title}</h1>
            </div>

            {/* <div className={styles['repo-meta']}>
              <span className={styles['meta-strong']}>{safeDocsList.length}</span>
              <span className={styles['meta-label']}>文档</span>
              <span className={styles['meta-strong']}>{word_count}</span>
              <span className={styles['meta-label']}>字</span>
            </div> */}

            <div
              className={styles['owner-avatar']}
              aria-hidden="true"
              style={ownerAvatar ? { backgroundImage: `url(${ownerAvatar})` } : undefined}
            />
          </div>

          <div className={styles['hero-actions']}>
            <Tooltip title={isCollect ? '已收藏' : '收藏'}>
              <button type="button" className={styles['outline-action']} onClick={onToggleCollect}>
                <i
                  className={`iconfont ${isCollect ? 'icon-shoucang-yishoucang' : 'icon-shoucang2'}`}
                />
                <span>{isCollect ? '已收藏' : '收藏'}</span>
              </button>
            </Tooltip>
            <Tooltip title="分享">
              <button type="button" className={styles['outline-action']}>
                <i className="iconfont icon-zhuanfa" />
                <span>分享</span>
              </button>
            </Tooltip>
          </div>
        </header>

        <section className={styles['welcome-section']}>
          <div className={styles['welcome-title']}>
            <span className={styles['welcome-emoji']} aria-hidden="true">
              👋
            </span>
            <span>{title}</span>
          </div>
          <p className={styles['welcome-desc']}>{repo_desc}</p>
        </section>

        <section className={styles['document-section']}>
          <ul className={styles['document-list']}>
            {safeDocsList.map((item) => (
              <li key={item.docs_id} className={styles['document-item']}>
                <span className={`${styles['document-title']} ellipse-one-line`}>
                  {item.docs_name}
                </span>
                <span className={styles['document-line']} aria-hidden="true" />
              </li>
            ))}
          </ul>
        </section>
      </div>
    </section>
  );
};

export default RepoDetailHomeView;
