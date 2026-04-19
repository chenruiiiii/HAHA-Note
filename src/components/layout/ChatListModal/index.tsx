'use client';
import { useEffect, useState } from 'react';
import './style.scss';
import emitter from '@/lib/mitt';
import { Emitter } from 'mitt';
import { Segmented } from 'antd';
import HASearchBox from '@/components/common/HASearchBox';
import useChatMissionList, { type ChatMissionAlign } from '@/hooks/layer/useChatMissionList';
import HASkeleton from '@/components/common/HASkeleton';

type Events = {
  'portal-status': boolean;
};

const typeEmitter = emitter as unknown as Emitter<Events>;

const ChatListModal = () => {
  const [, setOpen] = useState(false);
  const [alignValue, setAlignValue] = useState<ChatMissionAlign>('最近任务');
  const { data, isLoading, error } = useChatMissionList(alignValue);

  const handleClick = (id: string) => {
    console.log(id, 'chat-id');
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
                onClick={() => handleClick(item._id)}
              >
                {item.title}
              </div>
            ))}
          {!isLoading && error && <div className="chat-list-item">获取数据失败</div>}
          {!isLoading && !error && !data.length && <div className="chat-list-item">暂无数据</div>}
        </div>
      </div>
    </div>
  );
};

export default ChatListModal;
