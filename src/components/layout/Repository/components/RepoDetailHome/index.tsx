'use client';

import { Tooltip } from 'antd';
import styles from './style.module.scss';
import { RepoDetailType } from '../../types';

const RepoDetailHome = ({
  name,
  word_count,
  repo_list,
  avatar,
  file_desc_title,
  file_desc,
  collect,
}: RepoDetailType) => {
  const ownerAvatar = avatar[0];

  return (
    <section className={styles['repo-detail-home']}>
      <div className={styles['repo-card']}>
        <header className={styles['hero-section']}>
          <div className={styles['hero-main']}>
            <div className={styles['hero-title-row']}>
              <h1 className={styles['repo-title']}>{name}</h1>
            </div>

            <div className={styles['repo-meta']}>
              <span className={styles['meta-strong']}>{repo_list.length}</span>
              <span className={styles['meta-label']}>文档</span>
              <span className={styles['meta-strong']}>{word_count}</span>
              <span className={styles['meta-label']}>字</span>
            </div>

            <div
              className={styles['owner-avatar']}
              aria-hidden="true"
              style={ownerAvatar ? { backgroundImage: `url(${ownerAvatar})` } : undefined}
            />
          </div>

          <div className={styles['hero-actions']}>
            <Tooltip title={collect ? '已收藏' : '收藏'}>
              <button type="button" className={styles['outline-action']}>
                <i
                  className={`iconfont ${collect ? 'icon-shoucang-yishoucang' : 'icon-shoucang2'}`}
                />
                <span>{collect ? '已收藏' : '收藏'}</span>
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
            <span>{file_desc_title}</span>
          </div>
          <p className={styles['welcome-desc']}>{file_desc}</p>
        </section>

        <section className={styles['document-section']}>
          <ul className={styles['document-list']}>
            {repo_list.map((item) => (
              <li key={`${item.id}-${item.update_time}`} className={styles['document-item']}>
                <span className={`${styles['document-title']} ellipse-one-line`}>{item.name}</span>
                <span className={styles['document-line']} aria-hidden="true" />
                <time
                  className={styles['document-time']}
                  dateTime={item.update_time.replace(' ', 'T')}
                >
                  {item.update_time}
                </time>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </section>
  );
};

export default RepoDetailHome;
