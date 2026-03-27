import React from 'react';
import styles from './style.module.scss';
import HAVirtualScroll from '@/components/common/HAVirtualScroll';
import TapTipEditor from '../TapTipEditor';

const SubtotalItem = () => {
  return (
    <div className={styles['subtotal-item']}>
      <TapTipEditor />
    </div>
  );
};

export default SubtotalItem;
