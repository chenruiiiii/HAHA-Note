'use client';
import { useEffect, useState } from 'react';
import styles from './style.module.scss';
import emitter from '@/lib/mitt';

interface PostingBoxProps {
  chatId: string;
}

const PostingBox = ({ chatId }: PostingBoxProps) => {
  const [isStreaming, setIsStreaming] = useState(true);
  useEffect(() => {
    const quitStreaming = (payload: { chatId: string }) => {
      if (payload.chatId !== chatId) return;
      setIsStreaming(false);
    };
    emitter.on('quit-streaming', quitStreaming);
    return () => {
      emitter.off('quit-streaming', quitStreaming);
    };
  }, [chatId]);

  useEffect(() => {
    const restartStreaming = (payload: { chatId: string }) => {
      if (payload.chatId !== chatId) return;
      setIsStreaming(true);
    };
    emitter.on('start-streaming', restartStreaming);
    return () => {
      emitter.off('start-streaming', restartStreaming);
    };
  }, [chatId]);

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
