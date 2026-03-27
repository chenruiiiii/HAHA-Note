import React from 'react';
import styles from './style.module.scss';
import HATitle from '@/components/layout/Start/components/HATitle';
import TapTipEditor from '../TapTipEditor';

const NewSubtotal = () => {
  return (
    <div className={styles['new-subtotal']}>
      <HATitle title="小记" />
      <div className="create">
        <TapTipEditor></TapTipEditor>
      </div>
    </div>
  );
};

export default NewSubtotal;
