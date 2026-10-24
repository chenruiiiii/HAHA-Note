'use client';
import { useEffect, useRef, useState } from 'react';
import './style.scss';
import emitter from '@/lib/mitt';
import { Emitter } from 'mitt';
import { Popconfirm, Segmented } from 'antd';
import HASearchBox from '@/components/common/HASearchBox';
import useChatMissionList, { type ChatMissionAlign } from '@/hooks/layer/useChatMissionList';
import HASkeleton from '@/components/common/HASkeleton';
import { usePathname, useRouter } from 'next/navigation';
import HAError from '@/components/common/HAError';
import HAEmpty from '@/components/common/HAEmpty';
import { DeleteOutlined, LoadingOutlined } from '@ant-design/icons';
import { errorMessage, successMessage } from '@/utils/message_reminder';

// 打开会话防抖：双击列表项会触发两次 router.push（同 URL 同路由状态 = 重复 RSC 请求），
// 用短窗口拦截毫秒级重复，不影响正常反复打开同一会话。
const OPEN_CHAT_DEBOUNCE_MS = 500;

type Events = {
  'portal-status': boolean;
};

const typeEmitter = emitter as unknown as Emitter<Events>;

const ChatListModal = () => {
  const router = useRouter();
  const pathname = usePathname();
  const lastOpenChatAtRef = useRef(0);
  const [, setOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [alignValue, setAlignValue] = useState<ChatMissionAlign>('最近任务');
  const { data, isLoading, error, deleteMission } = useChatMissionList(alignValue);
  const currentChatId = pathname?.match(/^\/ai-chat\/([^/]+)/)?.[1];

  const handleClick = (id: string, timeStamp: number) => {
    if (timeStamp - lastOpenChatAtRef.current < OPEN_CHAT_DEBOUNCE_MS) {
      return;
    }

    lastOpenChatAtRef.current = timeStamp;
    router.push(`/ai-chat/${id}`);
  };

  const handleDelete = async (chatId: string) => {
    setDeletingId(chatId);

    try {
      await deleteMission(chatId);
      successMessage('对话已删除');

      if (currentChatId === chatId) {
        router.push('/ai-chat-home');
      }
    } catch {
      errorMessage('删除失败，请稍后重试');
    } finally {
      setDeletingId(null);
    }
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
              <div className="chat-list-item" key={item._id}>
                <button
                  type="button"
                  className="chat-list-open ellipse-one-line"
                  title={item.title}
                  onClick={(event) => handleClick(item.docs_id, event.timeStamp)}
                >
                  {item.title}
                </button>
                <Popconfirm
                  title="删除这个对话？"
                  description="删除后将无法继续查看此对话。"
                  okText="删除"
                  cancelText="取消"
                  okButtonProps={{ danger: true }}
                  onConfirm={() => handleDelete(item.docs_id)}
                >
                  <button
                    type="button"
                    className="chat-delete-btn"
                    aria-label={`删除对话：${item.title}`}
                    title="删除对话"
                    disabled={deletingId === item.docs_id}
                  >
                    {deletingId === item.docs_id ? <LoadingOutlined spin /> : <DeleteOutlined />}
                  </button>
                </Popconfirm>
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
