'use client';
import { useCallback, useEffect, useRef } from 'react';
import InnerHeader from './components/InnerHeader';
import './style.scss';
import { useChat } from '@ai-sdk/react';
import emitter from '@/utils/mitt';
import ChatBottom from '../AIWritingHome/components/ChatBottom';
import { useAppSelector } from '@/store';
import { useHaChat } from '@/hooks/useHaChat';
import { useOneRequest } from '@/hooks/useOneRequest';
import PostingBox from './components/PostingBox';
import { formatTime } from '@/utils/timeFormatter';

interface AiChatProps {
  id: string;
}

const AiChat = ({ id }: AiChatProps) => {
  const { messages, status, stop, error, sendMessage } = useChat();
  const chatRef = useRef<HTMLDivElement>(null);
  const { isPosting, handlePostingClose, handlePostingOpen } = useHaChat();
  const { value } = useAppSelector((state) => ({ ...state.temp }));
  const { checkDuplicate } = useOneRequest();

  // 处理具体内容显示
  const handleParts = useCallback((id: string, parts: Array<any>, role: string) => {
    return (
      <>
        {parts.map((part, i) => {
          switch (part.type) {
            case 'text':
              return (
                <div key={`${id}-${i}`}>
                  {role !== 'user' && <PostingBox />}
                  {part.text}
                </div>
              );
            case 'image_url':
              return <img src={part.image_url.url} alt="image" />;
            default:
              return null;
          }
        })}
      </>
    );
  }, []);

  // 处理信息展示为为用户还是ai类型
  const handleContent = useCallback(
    (id: string, role: string, parts: Array<any>) => (
      <div className={[role === 'user' ? 'ask-box' : 'answer-box'].join('')} key={id}>
        {handleParts(id, parts, role)}
        {role === 'user' && <div className="chat-time-user">{formatTime(Date.now())}</div>}
      </div>
    ),
    [handleParts]
  );

  // 处理页面滚动
  const handleScroll = useCallback(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, []);

  // 监听status
  useEffect(() => {
    // 再次变为submitted时，说明开始新的请求，新对话滚动到可视窗口最上方
    if (status == 'submitted') {
      handleScroll();
    }

    // 再次变为ready时，流式传输结束
    if (status == 'ready') {
      handlePostingClose(); // 关闭发送中按钮
      emitter.emit('quit-streaming'); // 发布事件通知posting-box组件停止流式展示
    }
  }, [status]);

  // 结束流式传输，停止发送中状态
  useEffect(() => {
    const handler = () => {
      handlePostingClose();
    };
    emitter.on('stop-send-message', handler);
    return () => {
      emitter.off('stop-send-message', handler);
    };
  }, [handlePostingClose]);

  // chat-put组件发布 chat-message 消息时候发送消息
  useEffect(() => {
    const handler = (message: unknown) => {
      if (!checkDuplicate(message as string, {})) {
        sendMessage({ text: message as string });
      }
    };
    emitter.on('chat-message', handler);
    return () => {
      emitter.off('chat-message', handler);
    };
  }, [sendMessage]);

  // 从ai-chat-home跳转过来后直接发送请求
  useEffect(() => {
    if (value && !checkDuplicate(value as string, {})) {
      handlePostingOpen();
      sendMessage({ text: value });
    }
  }, [value]);

  return (
    <div className="ai-chat-container">
      <div className="header">
        <InnerHeader title="新建对话"></InnerHeader>
      </div>
      <div className="chat-box" ref={chatRef}>
        <div className="container">
          {messages.map((message) => handleContent(message.id, message.role, message.parts))}
        </div>
      </div>
      <ChatBottom></ChatBottom>
    </div>
  );
};

export default AiChat;
