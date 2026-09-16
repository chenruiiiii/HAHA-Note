'use client';
import styles from './style.module.scss';
import { useAppSelector } from '@/store';
import { selectChatState } from '@/store/modules/chat';

interface PostingBoxProps {
  chatId: string;
}

const PostingBox = ({ chatId }: PostingBoxProps) => {
  const requestStatus = useAppSelector((state) => selectChatState(state, chatId).requestStatus);

  const isThinking = requestStatus === 'submitted' || requestStatus === 'retrying';
  const isReplying = requestStatus === 'streaming';
  const showLoading = isThinking || isReplying;

  const loadingText = isThinking
    ? 'AI 思考中…'
    : isReplying
      ? 'AI 回复中…'
      : '内容正在生成中...';

  return (
    <div className={styles['posting-box']}>
      {showLoading && (
        <>
          <div className={styles['icon']}>
            <i className="iconfont icon-aixiezuo" style={{ color: '#ff' }}></i>
          </div>
          <span>{loadingText}</span>
        </>
      )}
    </div>
  );
};

export default PostingBox;
