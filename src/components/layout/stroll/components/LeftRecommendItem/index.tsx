'use client';
import React, { useEffect, useState } from 'react';
import styles from './style.module.scss';
import HAAvatar from '@/components/ui/HAAvatar';
import { LeftRecommendItemType } from '../../types/recommend';

const RecommendItem = ({
  id,
  user: { avatar, username },
  content: { title, description, image },
  likNum,
  detail_url,
}: LeftRecommendItemType) => {
  const [isLike, setIsLike] = useState<Boolean>(false);
  const [likeNumReadOnly, setLikeNumReadOnly] = useState<number>(0);
  const handleLikeClick = () => {
    setIsLike(!isLike);

    if (isLike) {
      // 采用 --乐观更新-- 策略
      // 通知父组件，添加like的帖子id
    } else {
      // 删除like的帖子id
    }
  };

  useEffect(() => {
    setLikeNumReadOnly((prev) => (isLike ? prev + 1 : prev - 1));
  }, [isLike]);

  useEffect(() => {
    setLikeNumReadOnly(likNum);
  }, []);
  return (
    <div className={styles['recommend-item']}>
      <div className={styles['user-title']}>
        <HAAvatar url={avatar} size="small" />
        <div className={styles['username']}>{username}</div>
      </div>
      <div className={styles['content']}>
        <div className={styles['left']}>
          <div className={styles['content-title']}>{title}</div>
          <div className={[styles['content-desc'], 'ellipse-two-line'].join(' ')}>
            {description}
          </div>
        </div>
        <div className={styles['img right']}>
          <img
            src="https://cdn.nlark.com/yuque/0/2023/png/29609/1689529079649-f7f7f7f7-f7f7f7f7-f7f7f7f7-f7f7f7f7-f7f7f7f7.png"
            alt=""
          />
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
        <div className={[styles['detail'], 'cursor-pointer'].join(' ')}>
          <i className="iconfont icon-gengduo1"></i>
          <span>查看原文</span>
        </div>
      </div>
    </div>
  );
};

export default RecommendItem;
