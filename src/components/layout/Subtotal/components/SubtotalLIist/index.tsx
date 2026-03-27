import React from 'react';
import styles from './style.module.scss';
import HAVirtualScroll from '@/components/common/HAVirtualScroll';
import SubtotalItem from '../SubtotalItem';
import HAPreview from '../TapTipEditor/components/HAPreview';

const SubtotalList = () => {
  return (
    <div className={styles['subtotal-list']}>
      <HAVirtualScroll>
        <HAPreview></HAPreview>
      </HAVirtualScroll>
    </div>
  );
};

export default SubtotalList;
