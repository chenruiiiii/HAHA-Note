import { useAppDispatch, useAppSelector } from '@/store';
import { setTempValueAction } from '@/store/modules/temp';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import { nanoid } from 'nanoid';
import emitter from '@/utils/mitt';
import { setPostingAction } from '@/store/modules/chat';

export function useHaChat() {
  const { isPosting } = useAppSelector((state) => ({ ...state.chat }));
  const dispatch = useAppDispatch();
  const router = useRouter();
  const pathname = usePathname();

  // 发送中按钮
  const handlePostingOpen = () => {
    dispatch(setPostingAction(true));
  };

  // 发送中按钮关闭
  const handlePostingClose = () => {
    dispatch(setPostingAction(false));
  };

  // 发送消息
  const handleSend = (message: string) => {
    handlePostingOpen();
    if (pathname === '/ai-chat-home') {
      // 先存储消息，再路由跳转，避免信息丢失
      dispatch(setTempValueAction(message));
      const id = nanoid();
      router.push(`/ai-chat/${id}`);
    } else {
      emitter.emit('chat-message', message);
    }
  };

  // 暂停流式发送消息
  const stopSendMessage = () => {
    emitter.emit('stop-send-message');
  };

  // 处理error
  const handleError = (error: string) => {
    handlePostingClose();
    console.log(error);
  };

  return { isPosting, handlePostingClose, handlePostingOpen, handleSend };
}
