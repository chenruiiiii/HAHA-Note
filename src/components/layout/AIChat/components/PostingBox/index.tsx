'use client';
import { useEffect, useState } from 'react';
import styles from './style.module.scss';
import emitter from '@/lib/mitt';

const PostingBox = () => {
  const [isStreaming, setIsStreaming] = useState(true);
  useEffect(() => {
    emitter.on('quit-streaming', () => {
      setIsStreaming(false);
    });
    return () => {
      emitter.off('quit-streaming');
    };
  }, [isStreaming]);
  return (
    <div className={styles['posting-box']}>
      {isStreaming && (
        <>
          <div className={styles['icon']}>
            <i className="iconfont icon-aixiezuo" style={{ color: '#ff' }}></i>
          </div>
          <span>内容正在生成中...</span>
        </>
      )}
    </div>
  );
};

export default PostingBox;
