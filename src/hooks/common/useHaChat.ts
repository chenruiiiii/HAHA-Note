import { useAppDispatch, useAppSelector } from '@/store';
import { useParams, usePathname, useRouter } from 'next/navigation';
import { nanoid } from 'nanoid';
import emitter from '@/lib/mitt';
import {
  selectChatState,
  selectCurrentChatId,
  setChatErrorAction,
  setChatRequestStateAction,
  setCurrentChatIdAction,
  setPostingAction,
} from '@/store/modules/chat';
import { errorMessage } from '@/utils/message_reminder';

export function useHaChat() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();

  // 当前会话 id：对话页取 URL 中的 [id]，首页取跳转前写入的 currentChatId
  const urlChatId = typeof params?.id === 'string' ? params.id : null;
  const storeChatId = useAppSelector(selectCurrentChatId);
  const activeChatId = urlChatId ?? storeChatId;

  // 会话级状态：只读当前 chatId 对应的状态，避免多会话互相污染
  const chatState = useAppSelector((state) =>
    activeChatId ? selectChatState(state, activeChatId) : undefined
  );
  const isPosting = chatState?.isPosting ?? false;
  const requestStatus = chatState?.requestStatus ?? 'idle';
  const lastError = chatState?.lastError ?? '';
  const retryCount = chatState?.retryCount ?? 0;

  // 发送中按钮
  const handlePostingOpen = () => {
    if (!activeChatId) return;
    dispatch(setPostingAction({ chatId: activeChatId, isPosting: true }));
  };

  // 发送中按钮关闭
  const handlePostingClose = () => {
    if (!activeChatId) return;
    dispatch(setPostingAction({ chatId: activeChatId, isPosting: false }));
  };

  // 发送消息
  const handleSend = (message: string) => {
    const trimmed = message.trim();

    if (!trimmed) {
      return;
    }

    if (pathname === '/ai-chat-home') {
      // 首页：生成会话 id，写入会话级状态，消息随 URL searchParams 带到对话页（刷新不丢）
      const id = nanoid();
      dispatch(setCurrentChatIdAction(id));
      dispatch(
        setChatRequestStateAction({
          chatId: id,
          isPosting: true,
          requestStatus: 'submitted',
          lastError: '',
        })
      );
      router.push(`/ai-chat/${id}?q=${encodeURIComponent(trimmed)}`);
    } else if (urlChatId) {
      // 对话页：事件携带 chatId，接收端过滤，只处理属于当前会话的事件
      dispatch(
        setChatRequestStateAction({
          chatId: urlChatId,
          isPosting: true,
          requestStatus: 'submitted',
          lastError: '',
        })
      );
      emitter.emit('chat-message', { message: trimmed, chatId: urlChatId });
    }
  };

  // 暂停流式发送消息（仅针对当前会话）
  const stopSendMessage = () => {
    if (!urlChatId) return;
    emitter.emit('stop-send-message', { chatId: urlChatId });
  };

  // 处理error
  const handleError = (error: string) => {
    if (activeChatId) {
      dispatch(setChatErrorAction({ chatId: activeChatId, error }));
    }
    errorMessage(error);
  };

  return {
    isPosting,
    requestStatus,
    lastError,
    retryCount,
    activeChatId,
    handlePostingClose,
    handlePostingOpen,
    handleSend,
    stopSendMessage,
    handleError,
  };
}
