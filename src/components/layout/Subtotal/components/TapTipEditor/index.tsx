'use client';

import styles from './style.module.scss';
import HATipTapEditor from './components/HATipTapEditor';
import { Button } from 'antd';
import { useState } from 'react';

const TapTipEditor = () => {
  const [isDisabled, setIsDisabled] = useState(true);
  return (
    <div className={styles['tap-tip-editor']}>
      <HATipTapEditor />
      <div className={styles['post']}>
        <Button type="primary" disabled={isDisabled}>
          小记一下
        </Button>
        <span className="post-reminder">按 Ctrl + Enter 发布</span>
      </div>
    </div>
  );
};

export default TapTipEditor;
