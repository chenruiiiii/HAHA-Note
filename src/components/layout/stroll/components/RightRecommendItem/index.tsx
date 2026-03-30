import React from 'react';
import styles from './style.module.scss';
import HAAvatar from '@/components/common/HAAvatar';
import { RightRecommendItemType } from '../../types/recommend';

const RightRecommendItem = ({
  id,
  user: { avatar, username },
  recommend_title,
}: RightRecommendItemType) => {
  return (
    <div className={styles['recommend-item']}>
      <div className={styles['info']}>
        <HAAvatar size="middle" url={avatar} />
        <div className={styles['right']}>
          <div className={styles['username']}>{username} </div>
          <div className={[styles['signature'], 'ellipse-one-line'].join(' ')}>
            {recommend_title}
          </div>
        </div>
      </div>
      <div className="recommend-title">{recommend_title}</div>
    </div>
  );
};

export default RightRecommendItem;
