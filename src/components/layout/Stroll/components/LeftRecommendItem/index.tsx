'use client';
import React, { useState } from 'react';
import styles from './style.module.scss';
import HAAvatar from '@/components/common/HAAvatar';
import { RecommendDetailType } from '../../types/recommend';

const RecommendItem = ({
  _id,
  id,
  author: { avatar, name },
  title_html,
  description_html,
  source_url,
  like_count,
}: RecommendDetailType) => {
  const [isLike, setIsLike] = useState<boolean>(false);
  const [likeNumReadOnly, setLikeNumReadOnly] = useState<number>(like_count);
  // 点赞 （乐观更新）
  const handleLikeClick = () => {
    setIsLike((prev) => {
      const next = !prev;
      if (next) {
        // 采用 --乐观更新-- 策略
        // 通知父组件，添加like的帖子id
        setLikeNumReadOnly(likeNumReadOnly + 1);
      } else {
        // 删除like的帖子id
        setLikeNumReadOnly(likeNumReadOnly - 1);
      }
      return next;
    });
  };

  // 跳转详情页
  const handleToDetail = () => {
    window.open(`${process.env.NEXT_PUBLIC_BASE_URL}/public-note/${id}`, '_blank');
  };

  const handleOpenSource = () => {
    window.open(`/public-note/${id}`, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className={styles['recommend-item']}>
      <div className={styles['user-title']}>
        <HAAvatar url={avatar} size="small" />
        <div className={styles['username']}>{name}</div>
      </div>
      <div className={styles['content']}>
        <div className={styles['left']}>
          <div
            className={[styles['content-title'], 'cursor-pointer-hover'].join(' ')}
            onClick={handleToDetail}
          >
            {title_html}
          </div>
          <div
            className={[styles['content-desc'], 'ellipse-two-line', 'cursor-pointer-hover'].join(
              ' '
            )}
            onClick={handleToDetail}
          >
            {description_html}
          </div>
        </div>
        <div className={styles['img right']}>
          {source_url && (
            <div
              className={styles['img-cover']}
              aria-hidden="true"
              style={{ backgroundImage: `url(${source_url})` }}
            />
          )}
        </div>
      </div>
      <div className={styles['func']}>
        <div className={[styles['like'], 'cursor-pointer'].join(' ')}>
          {isLike ? (
            <i
              className="iconfont icon-dianzan_kuai icon-theme-color "
              onClick={handleLikeClick}
            ></i>
          ) : (
            <i className="iconfont icon-dianzan" onClick={handleLikeClick}></i>
          )}
          <span>{likeNumReadOnly}</span>
        </div>
        <div className={[styles['detail'], 'cursor-pointer'].join(' ')} onClick={handleOpenSource}>
          <i className="iconfont icon-gengduo1"></i>
          <span>查看原文</span>
        </div>
      </div>
    </div>
  );
};

export default RecommendItem;
