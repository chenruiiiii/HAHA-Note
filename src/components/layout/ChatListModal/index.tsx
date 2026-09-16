'use client';
import { useEffect, useRef, useState } from 'react';
import './style.scss';
import emitter from '@/lib/mitt';
import { Emitter } from 'mitt';
import { Segmented } from 'antd';
import HASearchBox from '@/components/common/HASearchBox';
import useChatMissionList, { type ChatMissionAlign } from '@/hooks/layer/useChatMissionList';
import HASkeleton from '@/components/common/HASkeleton';
import { useRouter } from 'next/navigation';
import HAError from '@/components/common/HAError';
import HAEmpty from '@/components/common/HAEmpty';

// 打开会话防抖：双击列表项会触发两次 router.push（同 URL 同路由状态 = 重复 RSC 请求），
// 用短窗口拦截毫秒级重复，不影响正常反复打开同一会话。
const OPEN_CHAT_DEBOUNCE_MS = 500;

type Events = {
  'portal-status': boolean;
};

const typeEmitter = emitter as unknown as Emitter<Events>;

const ChatListModal = () => {
  const router = useRouter();
  const lastOpenChatAtRef = useRef(0);
  const [, setOpen] = useState(false);
  const [alignValue, setAlignValue] = useState<ChatMissionAlign>('最近任务');
  const { data, isLoading, error } = useChatMissionList(alignValue);

  const handleClick = (id: string, timeStamp: number) => {
    if (timeStamp - lastOpenChatAtRef.current < OPEN_CHAT_DEBOUNCE_MS) {
      return;
    }

    lastOpenChatAtRef.current = timeStamp;
    console.log(id, 'chat-id');
    router.push(`/ai-chat/${id}`);
  };

  useEffect(() => {
    const handler = (status: boolean) => {
      setOpen(status);
    };
    typeEmitter.on('portal-status', handler);

    return () => {
      typeEmitter.off('portal-status', handler);
    };
  }, []);

  return (
    <div className="chat-list-modal">
      <div className="chat-list-container">
        <Segmented
          value={alignValue}
          style={{ marginBottom: 8 }}
          onChange={setAlignValue}
          options={['最近任务', '收藏任务']}
        />
        <HASearchBox />
        <div className="list">
          {isLoading && <HASkeleton num={3} />}
          {!isLoading &&
            data.map((item) => (
              <div
                className="chat-list-item ellipse-one-line cursor-pointer"
                key={item._id}
                onClick={(e) => handleClick(item.docs_id, e.timeStamp)}
              >
                {item.title}
              </div>
            ))}
          {!isLoading && error && <HAError />}
          {!isLoading && !error && !data.length && <HAEmpty />}
        </div>
      </div>
    </div>
  );
};

export default ChatListModal;
