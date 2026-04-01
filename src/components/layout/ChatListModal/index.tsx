'use client';
import { useEffect, useState } from 'react';
import './style.scss';
import emitter from '@/utils/mitt';
import { Emitter } from 'mitt';
import { Segmented } from 'antd';
import HASearchBox from '@/components/common/HASearchBox';

interface ListItem {
  id: string;
  title: string;
}

type Align = '最近任务' | '收藏任务';

type Events = {
  'portal-status': boolean;
};

const typeEmitter = emitter as unknown as Emitter<Events>;

const ChatListModal = () => {
  const [open, setOpen] = useState(false);

  const handleModalStatus = () => {
    setOpen(!open);
    console.log('open-status', open);
  };
  const [alignValue, setAlignValue] = useState<Align>('最近任务');

  const onChange = (key: string) => {
    console.log(key);
  };
  const [list, setList] = useState<ListItem[]>([
    { id: '1', title: '任务1任务1任务1任务1任务1任务1任务1任务1任务1' },
    { id: '2', title: '任务2' },
  ]);

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
          {list.length &&
            list.map((item, _) => (
              <div
                className="chat-list-item ellipse-one-line cursor-pointer"
                key={item.id}
                onClick={() => handleClick(item.id)}
              >
                {item.title}
              </div>
            ))}
        </div>
      </div>
    </div>
  );
};

export default ChatListModal;
