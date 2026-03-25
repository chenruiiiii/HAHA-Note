import React from 'react';
import styles from './style.module.scss';
import HAVirtualScroll from '@/components/common/HAVirtualScroll';
import SubtotalItem from '../SubtotalItem';

const SubtotalList = () => {
  return (
    <div className={styles['subtotal-list']}>
      <HAVirtualScroll>
        <SubtotalItem></SubtotalItem>
      </HAVirtualScroll>
    </div>
  );
};

export default SubtotalList;
