import React from 'react';
import styles from './style.module.scss';
import RecommendList from '../RecommendList';

const RightStroll = () => {
  return (
    <div className={styles['right-stroll']}>
      <div className={[styles['recommend-title'], 'f-sb'].join(' ')}>
        <div className={styles['left']}>
          推荐<span className={styles['garden']}>花园</span>
        </div>
        <div className={[styles['right'], 'cursor-pointer'].join(' ')}>换一换</div>
      </div>
      <RecommendList isLeft={false} />
    </div>
  );
};

export default RightStroll;
