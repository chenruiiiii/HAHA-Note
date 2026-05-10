import React from 'react';
import styles from './style.module.scss';
import HAVirtualScroll from '@/components/common/HAVirtualScroll';
import HAPreview from '../TapTipEditor/components/HAPreview';

const SubtotalList = () => {
  return (
    <div className={styles['subtotal-list']}>
      <HAVirtualScroll
        items={['preview']}
        itemHeight={480}
        itemKey={(item) => item}
        renderItem={() => <HAPreview />}
      />
    </div>
  );
};

export default SubtotalList;
